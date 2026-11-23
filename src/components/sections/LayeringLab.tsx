import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { DESKTOP_ORDER, FRAGRANCES, type FragranceKey } from "@/data/fragrances";
import { Reveal } from "@/components/lux/Reveal";

function Picker({ value, onChange, other, label }: { value: FragranceKey; onChange: (k: FragranceKey) => void; other: FragranceKey; label: string }) {
  return (
    <div>
      <p className="eyebrow-text mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {DESKTOP_ORDER.map((k) => {
          const f = FRAGRANCES[k];
          const on = k === value;
          return (
            <button
              key={k}
              type="button"
              disabled={k === other}
              aria-pressed={on}
              onClick={() => onChange(k)}
              className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs transition-all duration-500 ease-luxe disabled:opacity-25 ${on ? "border-foreground bg-foreground/10" : "border-border hover:border-foreground/40"}`}
            >
              <img src={f.img} alt="" className={`h-7 w-7 rounded-full object-contain transition-transform duration-500 ${on ? "scale-125" : ""}`} style={{ background: `color-mix(in oklab, ${f.tone} 25%, transparent)` }} />
              {f.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LayeringLab() {
  const [a, setA] = useState<FragranceKey>("rose");
  const [b, setB] = useState<FragranceKey>("terre");
  const [mix, setMix] = useState(50);
  const fa = FRAGRANCES[a];
  const fb = FRAGRANCES[b];
  const lead = mix <= 50 ? fa : fb;
  const blendName = `${fa.first} ${fb.second ?? fb.first}`;
  const notes = [
    ...fa.notes.heart.slice(0, mix <= 50 ? 2 : 1),
    ...fb.notes.heart.slice(0, mix > 50 ? 2 : 1),
    fa.notes.base[0],
    fb.notes.base[0],
  ];

  return (
    <section id="lab" className="bg-section relative overflow-hidden px-5 py-28 md:px-[6vw] md:py-36">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <Reveal className="order-2 lg:order-1">
          <div className="relative mx-auto aspect-square max-w-[520px]">
            {/* liquid orbs */}
            <div
              className="blob absolute inset-[8%] opacity-80 mix-blend-screen blur-2xl transition-all duration-1000 ease-luxe"
              style={{ background: fa.tone, transform: `translateX(${-mix / 3}%) scale(${1.2 - mix / 200})` }}
            />
            <div
              className="blob absolute inset-[8%] opacity-80 mix-blend-screen blur-2xl transition-all duration-1000 ease-luxe [animation-delay:-4s]"
              style={{ background: fb.tone, transform: `translateX(${(100 - mix) / 3}%) scale(${0.7 + mix / 200})` }}
            />
            <div className="glass-card absolute inset-[16%] grid place-items-center rounded-full">
              <div className="text-center">
                <p className="eyebrow-text">Your blend</p>
                <p key={blendName} className="font-display mt-2 text-[clamp(34px,5vw,60px)] leading-none animate-in fade-in zoom-in-90 duration-700">
                  {blendName}
                </p>
                <p className="mt-3 text-xs tabular-nums text-muted-foreground">
                  {100 - mix}% {fa.name} · {mix}% {fb.name}
                </p>
              </div>
            </div>
            <img src={fa.img} alt="" className="absolute bottom-0 left-0 h-1/3 animate-float-slow object-contain transition-all duration-700" style={{ opacity: 0.4 + (100 - mix) / 160 }} />
            <img src={fb.img} alt="" className="absolute bottom-0 right-0 h-1/3 animate-float-slow object-contain transition-all duration-700 [animation-delay:-3s]" style={{ opacity: 0.4 + mix / 160 }} />
          </div>
        </Reveal>

        <Reveal className="order-1 lg:order-2" delay={120}>
          <p className="eyebrow-text">Layering lab</p>
          <h2 className="font-display mt-4 text-[clamp(44px,6vw,88px)] leading-[0.95]">
            Two spirits. <span className="text-gradient-ink italic">One signature.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Pick a base and a top layer, then pour. The blend shifts its character as you slide.
          </p>
          <div className="mt-8 space-y-6">
            <Picker label="First layer" value={a} other={b} onChange={setA} />
            <Picker label="Second layer" value={b} other={a} onChange={setB} />
            <div>
              <p className="eyebrow-text mb-4">Pour ratio</p>
              <Slider value={[mix]} min={10} max={90} step={1} onValueChange={(v) => setMix(v[0] ?? 50)} aria-label="Blend ratio" />
            </div>
            <div className="flex flex-wrap gap-2">
              {notes.map((n, i) => (
                <span key={`${n}-${i}`} className="rounded-full border border-border px-3 py-1.5 text-xs animate-in fade-in duration-500" style={{ borderColor: i < 2 ? lead.tone : undefined }}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
