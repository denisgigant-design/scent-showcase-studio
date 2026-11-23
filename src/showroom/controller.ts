/**
 * Imperative showroom controller, ported from the original site's inline script.
 * It drives the scroll-orbit camera, gallery/detail state and the hidden lighting desk
 * by writing data-* attributes on #stage, which public/showroom/showroom-webgl.js reads.
 */
import { FRAGRANCES, type FragranceKey } from "@/data/fragrances";

export type ShowroomState = "gallery" | FragranceKey;

type Perfume3D = {
  spin(key: string): void;
  setLighting(values: Record<string, number>): void;
};
declare global {
  interface Window {
    Perfume3D?: Perfume3D;
    __perfumeEngineLoaded?: boolean;
  }
}

type Options = {
  getOrder: () => FragranceKey[];
  onState: (state: ShowroomState) => void;
  onCheckpoint?: (key: FragranceKey, progress: number) => void;
  onEscape: () => void;
};

export type ShowroomApi = {
  go(s: ShowroomState, spin?: boolean): void;
  step(delta: number): void;
  orbitTo(key: FragranceKey): void;
  updateScroll(): void;
  getState(): ShowroomState;
};

export function initShowroom(opts: Options): { api: ShowroomApi; dispose: () => void } {
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const stage = $("#stage");
  const track = $("#experience");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const cleanups: Array<() => void> = [];
  const on = <K extends keyof WindowEventMap>(
    target: Window | Document | HTMLElement,
    type: K | string,
    fn: (e: any) => void,
    o?: AddEventListenerOptions,
  ) => {
    target.addEventListener(type, fn, o);
    cleanups.push(() => target.removeEventListener(type, fn, o));
  };

  let state: ShowroomState = "gallery";
  let checkpoint: FragranceKey = "galet";
  let detailExitTimer: ReturnType<typeof setTimeout> | undefined;

  const panelChildren = () =>
    Array.from(document.querySelector(".detail-panel")?.children ?? []) as HTMLElement[];

  function setState(s: ShowroomState) {
    if (state === s) return;
    const fromGallery = state === "gallery";
    state = s;
    stage.dataset["state"] = s;
    const inGallery = s === "gallery";
    clearTimeout(detailExitTimer);
    if (!inGallery) stage.dataset["detailOpen"] = "";
    else detailExitTimer = setTimeout(() => delete stage.dataset["detailOpen"], motion.matches ? 0 : 380);
    ($("#gallery") as HTMLElement & { inert: boolean }).inert = !inGallery;
    ($("#detail") as HTMLElement & { inert: boolean }).inert = inGallery;
    opts.onState(s);
    if (motion.matches) return;
    if (inGallery) {
      panelChildren().forEach((el, i) => {
        el.getAnimations().forEach((a) => a.cancel());
        el.animate(
          [
            { opacity: 1, transform: "translate(0,0)" },
            { opacity: 0, transform: "translate(34px,12px)" },
          ],
          { duration: 260, delay: i * 55, easing: "ease-in", fill: "forwards" },
        );
      });
    } else {
      panelChildren()
        .reverse()
        .forEach((el, i) => {
          el.getAnimations().forEach((a) => a.cancel());
          el.animate(
            [
              { opacity: 0, transform: "translate(34px,12px)", filter: "blur(6px)" },
              { opacity: 1, transform: "translate(0,0)", filter: "blur(0)" },
            ],
            {
              duration: fromGallery ? 520 : 430,
              delay: i * 70,
              easing: "cubic-bezier(.2,.75,.25,1)",
              fill: "backwards",
            },
          );
        });
    }
  }

  function updateScroll() {
    const extent = Math.max(1, track.offsetHeight - stage.clientHeight);
    const p = Math.max(0, Math.min(1, -track.getBoundingClientRect().top / extent));
    stage.dataset["progress"] = String(p);
    const order = opts.getOrder();
    checkpoint = order[Math.max(0, Math.round(p * order.length) - 1)] ?? order[0]!;
    stage.dataset["checkpoint"] = checkpoint;
    opts.onCheckpoint?.(checkpoint, p);
    window.dispatchEvent(new Event("perfume-progress"));
  }

  function go(s: ShowroomState, spin = false) {
    if (s === "gallery") {
      setState("gallery");
      updateScroll();
      return;
    }
    setState(s);
    if (spin) window.Perfume3D?.spin(s);
    updateScroll();
  }

  function orbitTo(key: FragranceKey) {
    const extent = Math.max(1, track.offsetHeight - stage.clientHeight);
    setState("gallery");
    const order = opts.getOrder();
    const progress = (order.indexOf(key) + 1) / order.length;
    const top = track.getBoundingClientRect().top + window.scrollY + extent * progress;
    window.scrollTo({ top, behavior: motion.matches ? "instant" : "smooth" });
    if (motion.matches) updateScroll();
  }

  function step(delta: number) {
    const list = opts.getOrder();
    const current = state === "gallery" ? checkpoint : state;
    const i = (list.indexOf(current) + delta + list.length) % list.length;
    if (state === "gallery") orbitTo(list[i]!);
    else go(list[i]!, true);
  }

  let ticking = false;
  on(
    window,
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        updateScroll();
      });
    },
    { passive: true },
  );
  on(window, "resize", updateScroll);
  on(window, "perfume-collection-request", () => go("gallery"));

  // Gallery bays + hero bottle
  on(stage, "click", (e: MouseEvent) => {
    const bay = (e.target as HTMLElement).closest<HTMLElement>(".gallery-bay[data-go]");
    if (bay) go(bay.dataset["go"] as FragranceKey, true);
    if ((e.target as HTMLElement).closest("#heroProduct")) go("gallery");
  });

  // ---------- Hidden lighting desk (triple-tap the wordmark) ----------
  const desk = document.querySelector<HTMLElement>("#lightDesk");
  const wordmark = document.querySelector<HTMLElement>("#homeBtn");
  if (desk && wordmark) {
    const sliders = Array.from(desk.querySelectorAll<HTMLInputElement>("input[type=range]"));
    const settingsKey = "unveiled-finest-lighting-v1";
    const presetKey = "unveiled-finest-lighting-preset-v1";
    let savedSettings: Record<string, number> = {};
    let lightingPreset: Record<string, number> | null = null;
    try {
      savedSettings = JSON.parse(localStorage.getItem(settingsKey) || "{}") || {};
    } catch {}
    try {
      lightingPreset = JSON.parse(localStorage.getItem(presetKey) || "null");
    } catch {}
    const storePreset = (values: Record<string, number>) => {
      lightingPreset = { ...values };
      try {
        localStorage.setItem(presetKey, JSON.stringify(values));
        return true;
      } catch {
        return false;
      }
    };
    const syncLighting = () => {
      const values: Record<string, number> = {};
      for (const input of sliders) {
        values[input.dataset["light"]!] = input.valueAsNumber;
        const out = input.previousElementSibling?.querySelector("output");
        if (out) out.value = input.value + input.dataset["unit"];
        input.setAttribute("aria-valuetext", input.value + input.dataset["unit"]);
      }
      window.Perfume3D?.setLighting(values);
      return values;
    };
    for (const input of sliders) {
      const v = savedSettings[input.dataset["light"]!] ?? lightingPreset?.[input.dataset["light"]!];
      if (Number.isFinite(v)) input.value = String(v);
    }
    const initial = syncLighting();
    if (!lightingPreset) storePreset(initial);
    on(window, "perfume-ready", syncLighting);
    on(desk, "input", () => {
      const values = syncLighting();
      try {
        localStorage.setItem(settingsKey, JSON.stringify(values));
      } catch {}
    });
    const status = desk.querySelector<HTMLOutputElement>("#presetStatus")!;
    on(desk.querySelector("#deskSave")!, "click", () => {
      status.value = storePreset(syncLighting()) ? "Preset saved on this device." : "Preset saved for this visit.";
    });
    on(desk.querySelector("#deskReset")!, "click", () => {
      for (const input of sliders)
        input.value = String(lightingPreset?.[input.dataset["light"]!] ?? input.defaultValue);
      status.value = "Preset restored.";
      syncLighting();
      try {
        localStorage.removeItem(settingsKey);
      } catch {}
    });
    const closeDesk = () => {
      desk.hidden = true;
      wordmark.focus({ preventScroll: true });
    };
    on(desk.querySelector("#deskClose")!, "click", closeDesk);
    let taps = 0;
    let tapTimer: ReturnType<typeof setTimeout> | undefined;
    on(wordmark, "click", () => {
      clearTimeout(tapTimer);
      if (!desk.hidden) {
        taps = 0;
        closeDesk();
        return;
      }
      if (++taps === 3) {
        taps = 0;
        desk.hidden = false;
        desk.querySelector<HTMLElement>("#deskClose")?.focus({ preventScroll: true });
        return;
      }
      tapTimer = setTimeout(() => {
        taps = 0;
        go("gallery");
        window.scrollTo({ top: 0, behavior: motion.matches ? "instant" : "smooth" });
      }, 450);
    });
    on(window, "keydown", (event: KeyboardEvent) => {
      if (!desk.hidden && (desk.contains(event.target as Node) || event.key === "Escape")) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeDesk();
        }
        event.stopImmediatePropagation();
      }
    }, { capture: true });
  }

  on(window, "keydown", (event: KeyboardEvent) => {
    const t = event.target as HTMLElement;
    if (t.closest("input, textarea, select, [role=slider], [role=dialog]")) return;
    if (event.key === "Escape") {
      opts.onEscape();
      go("gallery");
    }
    const rect = stage.getBoundingClientRect();
    const stageVisible = rect.bottom > 0 && rect.top < innerHeight;
    if (!stageVisible) return;
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  });

  // Intro loader
  const loader = document.querySelector("#loader");
  const hideLoader = () => loader?.classList.add("out");
  on(window, "perfume-ready", hideLoader, { once: true });
  const loaderTimer = setTimeout(hideLoader, 8000);

  updateScroll();

  return {
    api: { go, step, orbitTo, updateScroll, getState: () => state },
    dispose() {
      clearTimeout(loaderTimer);
      clearTimeout(detailExitTimer);
      cleanups.forEach((c) => c());
    },
  };
}

/** Loads the original WebGL showroom engine once per page. */
export function loadShowroomEngine() {
  if (window.__perfumeEngineLoaded) return;
  window.__perfumeEngineLoaded = true;
  const script = document.createElement("script");
  script.type = "module";
  script.src = `${import.meta.env.BASE_URL}showroom/showroom-webgl.js?v=lovable-1`;
  document.body.appendChild(script);
}

export const fragranceName = (k: FragranceKey) => FRAGRANCES[k].name;
