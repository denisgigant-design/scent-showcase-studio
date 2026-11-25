import { Bottle3D } from "@/components/lux/Bottle3D";
import { useState } from "react";
import { Plus, RotateCw, ZoomIn } from "lucide-react";
import { DESKTOP_ORDER, FRAGRANCES, type FragranceKey } from "@/data/fragrances";
import { Reveal } from "@/components/lux/Reveal";
import { Tilt } from "@/components/lux/Tilt";
import { useSite } from "@/components/site/store";

export function CollectionCards() {
  return (
    <section id="collection" className="bg-section relative px-5 py-28 md:px-[6vw] md:py-36">
      <Reveal className="mx-auto mb-16 max-w-3xl text-center">
        <p className="eyebrow-text">Up close</p>
        <h2 className="font-display mt-4 text-[clamp(44px,7vw,104px)] leading-[0.95]">
          Tilt it. <span className="text-gradient-ink italic">Flip it.</span> Zoom in.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
          Move across a card to catch the light. Tap to turn it over and read its notes. Hold the lens to look closer.
        </p>
      </Reveal>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
        {DESKTOP_ORDER.map((k, i) => (
          <Reveal key={k} delay={i * 90}>
            <BottleCard fkey={k} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function BottleCard({ fkey }: { fkey: FragranceKey }) {
  const f = FRAGRANCES[fkey];
  const { add, showInShowroom } = useSite();
  const [flipped, setFlipped] = useState(false);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);

  return (
    <Tilt className="rounded-[28px]" max={9}>
      <div className="flip relative aspect-[3/4.4] rounded-[28px]" data-flipped={flipped}>
        {/* Front */}
        <div
          className="flip-face glass-card absolute inset-0 overflow-hidden rounded-[28px]"
          style={{ background: `radial-gradient(ellipse at 50% 30%, color-mix(in oklab, ${f.tone} 34%, transparent), var(--card) 68%)` }}
        >
          <div className="absolute left-5 top-5 eyebrow-text">{f.num}</div>
          <button
            onClick={() => setFlipped(true)}
            aria-label={`Turn over ${f.name}`}
            className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full border border-border bg-basalt-deep/40 backdrop-blur transition hover:rotate-180 hover:bg-foreground/15"
          >
            <RotateCw className="size-3.5" />
          </button>
          <div
            className="tilt-pop absolute inset-x-0 top-[12%] flex h-[58%] cursor-zoom-in justify-center"
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setLens({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
            }}
            onPointerLeave={() => setLens(null)}
          >
            <Bottle3D
              k={f.key}
              label={`${f.name} perfume bottle`}
              className="h-full w-full transition-transform duration-700 ease-luxe"
              {...(lens ? { style: { transform: "scale(1.9)", transformOrigin: `${lens.x}% ${lens.y}%` } } : {})}
            />
            {lens && (
              <span className="pointer-events-none absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-basalt-deep/70 px-2 py-1 text-[9px] uppercase tracking-[0.18em] backdrop-blur">
                <ZoomIn className="size-3" /> Macro
              </span>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="eyebrow-text" style={{ color: f.tone }}>{f.family}</p>
            <h3 className="font-display mt-1 text-3xl leading-none">{f.name}</h3>
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => showInShowroom(fkey)}
                className="text-[10px] uppercase tracking-[0.18em] underline-offset-4 hover:underline"
              >
                View in 3D ↗
              </button>
              <span className="text-sm tabular-nums">€{f.price}</span>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="flip-face flip-back glass-card absolute inset-0 flex flex-col overflow-hidden rounded-[28px] p-5"
          style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${f.tone} 28%, var(--card)), var(--basalt-deep))` }}
        >
          <div className="flex items-center justify-between">
            <span className="eyebrow-text">Notes</span>
            <button
              onClick={() => setFlipped(false)}
              aria-label={`Turn back ${f.name}`}
              className="grid size-9 place-items-center rounded-full border border-border transition hover:-rotate-180 hover:bg-foreground/15"
            >
              <RotateCw className="size-3.5" />
            </button>
          </div>
          <h3 className="font-display mt-3 text-3xl leading-none">{f.name}</h3>
          <dl className="mt-5 flex-1 space-y-4 text-sm">
            {(["top", "heart", "base"] as const).map((t) => (
              <div key={t} className="border-t border-border pt-3">
                <dt className="eyebrow-text">{t}</dt>
                <dd className="mt-1 leading-snug">{f.notes[t].join(" · ")}</dd>
              </div>
            ))}
          </dl>
          <button
            onClick={() => add(fkey, 100)}
            className="mt-4 flex items-center justify-center gap-2 rounded-full bg-foreground py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition hover:scale-[1.03]"
          >
            <Plus className="size-3.5" /> Add 100 ml · €{f.price}
          </button>
        </div>
      </div>
    </Tilt>
  );
}
