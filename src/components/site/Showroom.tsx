import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import {
  DESKTOP_ORDER,
  FRAGRANCES,
  PHONE_ORDER,
  PHONE_QUERY,
  SIZES,
  priceFor,
  type FragranceKey,
  type Size,
} from "@/data/fragrances";
import { useMediaQuery } from "@/hooks/use-media-query";
import { initShowroom, loadShowroomEngine } from "@/showroom/controller";
import { Segmented } from "@/components/lux/Segmented";
import { useSite } from "./store";

/**
 * The original Unveiled Finest 3D showroom. Markup and ids mirror the original site so the
 * WebGL engine (public/showroom/showroom-webgl.js) can drive it unchanged.
 */
export function Showroom() {
  const { setState, state, apiRef, add, setBagOpen, setNotesOpen } = useSite();
  const phone = useMediaQuery(PHONE_QUERY);
  const order = phone ? PHONE_ORDER : DESKTOP_ORDER;
  const orderRef = useRef(order);
  orderRef.current = order;
  const [selected, setSelected] = useState<FragranceKey>("galet");
  const [size, setSize] = useState<Size>(100);
  const [checkpoint, setCheckpoint] = useState<FragranceKey>("galet");
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    (document.querySelector("#detail") as HTMLElement & { inert: boolean }).inert = true;
    const { api, dispose } = initShowroom({
      getOrder: () => orderRef.current,
      onState: (s) => {
        setState(s);
        if (s !== "gallery") {
          setSelected(s);
          setSize(100);
        }
      },
      onCheckpoint: (key, p) => {
        setCheckpoint(key);
        barRef.current?.style.setProperty("transform", `scaleX(${Math.max(0.02, p)})`);
      },
      onEscape: () => {
        setBagOpen(false);
        setNotesOpen(false);
      },
    });
    apiRef.current = api;
    loadShowroomEngine();
    return () => {
      dispose();
      apiRef.current = null;
    };
  }, [apiRef, setState, setBagOpen, setNotesOpen]);

  // Live layout switch: when the window flips between desktop and phone, re-sync the orbit.
  useEffect(() => {
    apiRef.current?.updateScroll();
  }, [phone, apiRef]);

  const f = FRAGRANCES[selected];
  const price = priceFor(selected, size);
  const inDetail = state !== "gallery";

  return (
    <section className="experience" id="experience" aria-label="Interactive perfume showroom">
      <div className="stage" id="stage" data-state="gallery">
        <canvas className="studio-rays" id="side-rays" aria-hidden="true" />
        <div id="showroom3d" aria-hidden="true" />
        <div className="gallery" id="gallery">
          {order.map((key) => (
            <button
              key={key}
              className={`gallery-bay ${key}`}
              data-go={key}
              aria-label={`Discover ${FRAGRANCES[key].name} perfume`}
            >
              {(key === "rose" || key === "galet") && <span className="image-plinth" aria-hidden="true" />}
              <img src={FRAGRANCES[key].img} alt={`${FRAGRANCES[key].name} perfume bottle`} />
              <span className="bay-caption">{FRAGRANCES[key].name}</span>
            </button>
          ))}
        </div>
        <div className="gallery-intro">
          <h1>
            The <em>spirits</em> collection.
          </h1>
        </div>

        {/* Orbit HUD — visible while browsing the shelf */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-[6] flex items-end justify-between gap-4 px-[4.3%] pb-5 transition-opacity duration-500 max-[679px]:justify-center max-[679px]:pb-4 ${inDetail ? "opacity-0" : "opacity-100"}`}
        >
          <div className="pointer-events-auto hidden items-center gap-3 eyebrow-text md:flex">
            <span className="relative h-7 w-4 rounded-full border border-foreground/50">
              <span className="absolute left-1/2 top-1.5 h-1.5 w-px -translate-x-1/2 animate-bounce bg-foreground" />
            </span>
            Scroll to orbit
          </div>
          <div className={`flex items-center gap-3 ${inDetail ? "" : "pointer-events-auto"}`}>
            <button
              type="button"
              onClick={() => apiRef.current?.step(-1)}
              aria-label="Previous bottle"
              className="grid size-9 place-items-center rounded-full border border-foreground/30 bg-basalt-deep/50 backdrop-blur-md transition hover:scale-110 hover:bg-foreground/15"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1.5">
                {order.map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Orbit to ${FRAGRANCES[key].name}`}
                    onClick={() => apiRef.current?.orbitTo(key)}
                    className="group relative h-4 w-7 md:w-9"
                  >
                    <span
                      className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full transition-all duration-500"
                      style={{
                        background: checkpoint === key ? FRAGRANCES[key].tone : "color-mix(in oklab, var(--foreground) 28%, transparent)",
                        boxShadow: checkpoint === key ? `0 0 12px ${FRAGRANCES[key].tone}` : "none",
                      }}
                    />
                  </button>
                ))}
              </div>
              <span className="h-px w-full origin-left overflow-hidden bg-foreground/10">
                <span ref={barRef} className="block h-px w-full origin-left bg-foreground/70 transition-transform duration-200" style={{ transform: "scaleX(0.02)" }} />
              </span>
            </div>
            <button
              type="button"
              onClick={() => apiRef.current?.step(1)}
              aria-label="Next bottle"
              className="grid size-9 place-items-center rounded-full border border-foreground/30 bg-basalt-deep/50 backdrop-blur-md transition hover:scale-110 hover:bg-foreground/15"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="detail" id="detail" aria-live="polite">
          <div className="detail-panel">
            <div className="mb-3 flex items-center gap-3 eyebrow-text justify-center max-[679px]:portrait:mb-1.5 max-[679px]:portrait:justify-start">
              <span className="size-1.5 rounded-full shadow-glow" style={{ background: f.tone, ["--glow" as string]: f.tone }} />
              {f.num} · {f.family}
            </div>
            <h2 id="productName" tabIndex={-1}>
              {f.first}
              {f.second && (
                <>
                  {" "}
                  <em>{f.second}</em>
                </>
              )}
            </h2>
            <p className="scent-desc" id="desc">
              {f.desc}
            </p>
            <div className="mb-4 flex flex-wrap items-center gap-2 justify-center max-[679px]:portrait:mb-2 max-[679px]:portrait:justify-start">
              <Segmented
                label="Bottle size"
                size="sm"
                value={size}
                onChange={setSize}
                options={SIZES.map((s) => ({ value: s, label: `${s} ml` }))}
              />
              <button
                type="button"
                onClick={() => setNotesOpen(true)}
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-foreground/5 px-3.5 py-2 text-[9px] font-medium uppercase tracking-[0.16em] backdrop-blur-md transition hover:border-foreground/50 hover:bg-foreground/10"
              >
                <Sparkles className="size-3 transition-transform duration-500 group-hover:rotate-180" style={{ color: f.tone }} />
                Zoom into notes
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 max-[679px]:portrait:justify-start">
              <button
                className="price detail-price"
                id="addBtn"
                type="button"
                aria-label={`Add ${f.name} ${size} ml to bag for €${price}`}
                onClick={() => add(selected, size)}
              >
                <span id="price" key={price} className="inline-block animate-in fade-in slide-in-from-bottom-2 duration-500">
                  €{price}
                </span>
                <span aria-hidden="true">+</span>
              </button>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label="Previous fragrance"
                  onClick={() => apiRef.current?.step(-1)}
                  className="grid size-9 place-items-center rounded-full border border-border bg-foreground/5 backdrop-blur-md transition hover:bg-foreground/15"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Next fragrance"
                  onClick={() => apiRef.current?.step(1)}
                  className="grid size-9 place-items-center rounded-full border border-border bg-foreground/5 backdrop-blur-md transition hover:bg-foreground/15"
                >
                  <ArrowRight className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Back to the collection"
                  onClick={() => apiRef.current?.go("gallery")}
                  className="grid size-9 place-items-center rounded-full border border-border bg-foreground/5 backdrop-blur-md transition hover:rotate-90 hover:bg-foreground/15"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
          <div className={`hero-product ${selected}`} id="heroProduct">
            <img src={f.img} id="heroImage" alt={`${f.name} bottle`} />
          </div>
        </div>
        <div
          className="product-drag"
          id="product-drag"
          role="button"
          tabIndex={0}
          aria-label="Drag bottle to rotate, or activate to return to collection"
        />
      </div>
    </section>
  );
}

/** Hidden lighting desk from the original site — triple-tap the wordmark to open. */
export function LightDesk() {
  const row = (id: string, light: string, label: string, unit: string, min: number, max: number, value: number) => (
    <>
      <label htmlFor={id}>
        {label}
        <output htmlFor={id}>
          {value}
          {unit}
        </output>
      </label>
      <input id={id} data-light={light} data-unit={unit} type="range" min={min} max={max} defaultValue={value} />
    </>
  );
  return (
    <aside id="lightDesk" aria-labelledby="lightTitle" hidden>
      <div className="desk-head">
        <h2 id="lightTitle">Lighting</h2>
        <button type="button" id="deskClose" aria-label="Close lighting settings">
          ×
        </button>
      </div>
      <p className="desk-status">Live lighting requires the 3D view.</p>
      <details name="light-section">
        <summary>Spotlight angle</summary>
        {row("light-aim", "aim", "Tilt toward back wall", "°", -20, 30, -5)}
      </details>
      <details name="light-section">
        <summary>Spotlight intensity</summary>
        {row("light-shelf", "shelf", "Shelf light", "%", 0, 200, 129)}
      </details>
      <details name="light-section">
        <summary>Second light</summary>
        {row("light-selection", "selection", "Selected bottle light", "%", 0, 200, 146)}
      </details>
      <details name="light-section">
        <summary>Far-left light</summary>
        {row("light-key", "key", "Intensity", "%", 0, 200, 111)}
        {row("light-distance", "distance", "Distance from wall", "%", 65, 160, 65)}
      </details>
      <button id="deskSave" type="button">
        Save preset
      </button>
      <button id="deskReset" type="button">
        Restore preset
      </button>
      <output id="presetStatus" aria-live="polite" />
    </aside>
  );
}
