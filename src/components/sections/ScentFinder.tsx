import { Bottle3D } from "@/components/lux/Bottle3D";
import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { FRAGRANCES, MOODS, rankFragrances, type Mood } from "@/data/fragrances";
import { DayNightSwitch } from "@/components/lux/DayNightSwitch";
import { Reveal } from "@/components/lux/Reveal";
import { useSite } from "@/components/site/store";

export function ScentFinder() {
  const { showInShowroom, add } = useSite();
  const [night, setNight] = useState(false);
  const [moods, setMoods] = useState<Mood[]>(["floral"]);
  const [intensity, setIntensity] = useState(55);
  const ranked = useMemo(
    () => rankFragrances({ moment: night ? "night" : "day", moods, intensity }),
    [night, moods, intensity],
  );
  const best = ranked[0]!;
  const f = FRAGRANCES[best.key];
  const toggleMood = (m: Mood) =>
    setMoods((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));

  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <section id="finder" className="relative overflow-hidden bg-basalt-deep px-5 py-28 md:px-[6vw] md:py-36">
      <div
        aria-hidden
        className="blob pointer-events-none absolute left-1/2 top-1/2 size-[680px] -translate-x-1/2 -translate-y-1/2 opacity-25 blur-[120px] transition-colors duration-1000"
        style={{ background: f.tone }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow-text">Scent finder</p>
          <h2 className="font-display mt-4 text-[clamp(44px,6vw,88px)] leading-[0.95]">
            Tell us the moment. <span className="text-gradient-ink italic">We’ll find the spirit.</span>
          </h2>

          <div className="mt-10 space-y-8">
            <div>
              <p className="eyebrow-text mb-3">01 — When will you wear it?</p>
              <div className="flex items-center gap-4 text-sm">
                <span className={night ? "text-muted-foreground" : ""}>Daylight</span>
                <DayNightSwitch night={night} onChange={setNight} />
                <span className={night ? "" : "text-muted-foreground"}>After dark</span>
              </div>
            </div>

            <div>
              <p className="eyebrow-text mb-3">02 — What draws you in?</p>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => {
                  const on = moods.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleMood(m.id)}
                      className={`rounded-full border px-4 py-2 text-xs transition-all duration-500 ease-luxe ${on ? "scale-105 border-foreground bg-foreground text-primary-foreground shadow-glow" : "border-border hover:border-foreground/50"}`}
                      style={{ ["--glow" as string]: f.tone }}
                    >
                      {on ? "✓ " : ""}
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="eyebrow-text mb-4">03 — How present should it be?</p>
              <Slider value={[intensity]} min={0} max={100} step={1} onValueChange={(v) => setIntensity(v[0] ?? 50)} aria-label="Intensity" />
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <span>A whisper</span>
                <span>A statement</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div key={best.key} className="glass-card relative overflow-hidden rounded-[32px] p-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="eyebrow-text">Your match</p>
                <h3 className="font-display mt-2 text-6xl leading-none">{f.name}</h3>
                <p className="mt-3 max-w-[16rem] text-sm text-muted-foreground">{night ? f.night : f.day}</p>
              </div>
              <div className="relative grid size-32 shrink-0 place-items-center">
                <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
                  <circle cx="60" cy="60" r={R} fill="none" stroke="var(--border)" strokeWidth="4" />
                  <circle
                    cx="60"
                    cy="60"
                    r={R}
                    fill="none"
                    stroke={f.tone}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - best.score / 100)}
                    style={{ transition: "stroke-dashoffset 1s var(--ease-luxe)", filter: `drop-shadow(0 0 6px ${f.tone})` }}
                  />
                </svg>
                <span className="font-display text-4xl tabular-nums">
                  {best.score}
                  <span className="text-base">%</span>
                </span>
              </div>
            </div>
            <Bottle3D k={f.key} drag label={`${f.name} bottle, drag to turn`} className="mx-auto mt-4 !block h-60 w-60" />
            <div className="mt-6 space-y-2">
              {ranked.slice(1).map((r) => (
                <div key={r.key} className="flex items-center gap-3 text-xs">
                  <span className="w-24 shrink-0">{FRAGRANCES[r.key].name}</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10">
                    <div className="h-full rounded-full transition-[width] duration-1000 ease-luxe" style={{ width: `${r.score}%`, background: FRAGRANCES[r.key].tone }} />
                  </div>
                  <span className="w-8 text-right tabular-nums text-muted-foreground">{r.score}%</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => showInShowroom(best.key)} className="rounded-full border border-foreground/40 px-5 py-3 text-[10px] uppercase tracking-[0.18em] transition hover:bg-foreground/10">
                See it in 3D ↗
              </button>
              <button onClick={() => add(best.key, 50)} className="rounded-full bg-foreground px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition hover:scale-105">
                Try 50 ml
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
