import { useEffect, useState } from "react";
import { useSite } from "./store";

const LINKS = [
  { id: "experience", label: "The Showroom", sub: "Orbit the five spirits in 3D" },
  { id: "collection", label: "Up Close", sub: "Tilt, flip and study every bottle" },
  { id: "finder", label: "Scent Finder", sub: "Find your match in seconds" },
  { id: "lab", label: "Layering Lab", sub: "Blend two spirits into one" },
  { id: "compare", label: "Compare", sub: "See their character side by side" },
];

export function Nav() {
  const { count, setBagOpen } = useSite();
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (!count) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 500);
    return () => clearTimeout(t);
  }, [count]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const goTo = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <ScrollProgress />
      <header className="nav">
        <button className="logo" id="homeBtn" aria-label="Unveiled Finest, return to collection">
          UNVEILED <i>Finest</i>
        </button>
        <div className="nav-right">
          <button
            id="bagBtn"
            aria-label={count ? `Open basket, ${count} items` : "Open basket"}
            onClick={() => setBagOpen(true)}
            className={`relative transition-transform duration-300 ${bump ? "scale-125" : ""}`}
          >
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m8 12 5-8m7 8-5-8M3 12h22l-2 3H5zm2.6 3 2 8h12.8l2-8M11 17l.6 3m5.4-3-.6 3" />
            </svg>
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-4 tracking-normal text-primary-foreground animate-in zoom-in duration-300">
                {count}
              </span>
            )}
          </button>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="relative z-[60] grid size-11 place-items-center"
          >
            <span className="relative block h-3 w-6">
              <span className={`absolute left-0 h-px w-6 bg-foreground transition-all duration-500 ease-luxe ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-px bg-foreground transition-all duration-500 ease-luxe ${open ? "top-1.5 w-6 -rotate-45" : "top-3 w-4"}`} />
            </span>
          </button>
        </div>
      </header>

      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-[24] flex flex-col justify-center bg-basalt-deep/95 px-[clamp(22px,8vw,140px)] backdrop-blur-2xl transition-[clip-path] duration-700 ease-luxe ${open ? "[clip-path:circle(150%_at_calc(100%-48px)_48px)]" : "pointer-events-none [clip-path:circle(0%_at_calc(100%-48px)_48px)]"}`}
      >
        <div aria-hidden className="blob pointer-events-none absolute -right-40 top-1/4 size-[520px] bg-primary/10 blur-3xl" />
        <nav className="relative flex flex-col gap-2 md:gap-4">
          {LINKS.map((l, i) => (
            <button
              key={l.id}
              tabIndex={open ? 0 : -1}
              onClick={() => goTo(l.id)}
              className={`group flex items-baseline gap-5 text-left transition-all duration-700 ease-luxe ${open ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
              style={{ transitionDelay: open ? `${120 + i * 70}ms` : "0ms" }}
            >
              <span className="eyebrow-text w-6">0{i + 1}</span>
              <span className="font-display text-[clamp(40px,8vw,104px)] leading-none transition-all duration-500 group-hover:translate-x-4 group-hover:italic group-hover:text-primary">
                {l.label}
              </span>
              <span className="hidden text-xs text-muted-foreground opacity-0 transition-opacity duration-500 group-hover:opacity-100 lg:inline">
                {l.sub}
              </span>
            </button>
          ))}
        </nav>
        <p
          className={`relative mt-14 max-w-sm text-xs leading-relaxed text-muted-foreground transition-all delay-500 duration-700 ${open ? "opacity-100" : "opacity-0"}`}
        >
          Tip: triple-tap the wordmark to open the hidden lighting desk. Use ← → keys to move between bottles.
        </p>
      </div>
    </>
  );
}

function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setP(max > 0 ? scrollY / max : 0);
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
      <div className="h-full origin-left bg-[image:var(--gradient-ink)]" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}
