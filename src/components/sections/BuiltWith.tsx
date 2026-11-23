import { Box, Hand, Layers, MonitorSmartphone, Sparkles, Wand2 } from "lucide-react";
import type { PointerEvent } from "react";
import { Reveal } from "@/components/lux/Reveal";

const FEATURES = [
  { icon: Box, title: "Real-time 3D", body: "Glass bottles, stone niches and reflecting water rendered live in your browser." },
  { icon: MonitorSmartphone, title: "Two layouts, one page", body: "A wide shelf on desktop, a stacked wall on phones — switching live as the screen changes." },
  { icon: Hand, title: "Touch the glass", body: "Drag to rotate, scroll to orbit, tilt cards, flip them, zoom in with the macro lens." },
  { icon: Wand2, title: "Smart finder", body: "A live recommendation that re-ranks every spirit as you change the moment and mood." },
  { icon: Layers, title: "Layering lab", body: "Blend any two fragrances and watch the colours and notes pour together." },
  { icon: Sparkles, title: "Built by conversation", body: "Every section here was designed and built by describing it to Lovable." },
];

function spot(e: PointerEvent<HTMLDivElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--sx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--sy", `${e.clientY - r.top}px`);
}

export function BuiltWith() {
  return (
    <section className="bg-section relative overflow-hidden px-5 py-28 md:px-[6vw] md:py-36">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="eyebrow-text">Behind the glass</p>
        <h2 className="font-display mt-4 text-[clamp(44px,6.5vw,96px)] leading-[0.95]">
          Imagined in words. <span className="text-gradient-ink italic">Built with Lovable.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">
          This showroom is a concept piece — a live demonstration of how far a single conversation can take a website.
        </p>
      </Reveal>
      <div className="mx-auto mt-16 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 70}>
            <div
              onPointerMove={spot}
              className="group glass-card relative h-full overflow-hidden rounded-3xl p-7 transition-transform duration-500 ease-luxe hover:-translate-y-1"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "radial-gradient(320px circle at var(--sx) var(--sy), color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%)" }}
              />
              <f.icon className="relative size-6 text-primary transition-transform duration-700 ease-luxe group-hover:rotate-12 group-hover:scale-125" />
              <h3 className="font-display relative mt-6 text-3xl">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-14 text-center" delay={200}>
        <a
          href="https://lovable.dev"
          target="_blank"
          rel="noreferrer"
          className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-foreground/30 px-7 py-4 text-[10px] font-medium uppercase tracking-[0.22em] transition hover:border-foreground"
        >
          <span aria-hidden className="absolute inset-0 -translate-x-full bg-[image:var(--gradient-ink)] opacity-20 transition-transform duration-700 ease-luxe group-hover:translate-x-0" />
          <span className="relative">Build yours on Lovable</span>
          <span className="relative transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
        </a>
      </Reveal>
    </section>
  );
}
