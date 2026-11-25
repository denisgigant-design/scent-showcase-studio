import { Bottle3D } from "@/components/lux/Bottle3D";
import { useState } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Switch } from "@/components/ui/switch";
import { DESKTOP_ORDER, FRAGRANCES, type FragranceKey, type Metrics } from "@/data/fragrances";
import { Reveal } from "@/components/lux/Reveal";
import { Counter } from "@/components/lux/Counter";

const AXES: { key: keyof Metrics; label: string }[] = [
  { key: "freshness", label: "Fresh" },
  { key: "floral", label: "Floral" },
  { key: "woody", label: "Woody" },
  { key: "smoky", label: "Smoky" },
  { key: "longevity", label: "Longevity" },
  { key: "sillage", label: "Trail" },
];

export function Compare() {
  const [on, setOn] = useState<Record<FragranceKey, boolean>>({ galet: true, rose: true, iris: false, terre: true, nacre: false });
  const data = AXES.map((a) => ({
    axis: a.label,
    ...Object.fromEntries(DESKTOP_ORDER.map((k) => [k, FRAGRANCES[k].metrics[a.key]])),
  }));

  return (
    <section id="compare" className="relative bg-basalt-deep px-5 py-28 md:px-[6vw] md:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="eyebrow-text">Compare</p>
          <h2 className="font-display mt-4 text-[clamp(44px,6vw,88px)] leading-[0.95]">
            Character, <span className="text-gradient-ink italic">charted.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_320px]">
          <Reveal className="glass-card aspect-square w-full rounded-[32px] p-2 sm:aspect-[4/3]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted-foreground)", fontSize: 11, letterSpacing: 2 }} />
                {DESKTOP_ORDER.filter((k) => on[k]).map((k) => (
                  <Radar
                    key={k}
                    dataKey={k}
                    stroke={FRAGRANCES[k].tone}
                    fill={FRAGRANCES[k].tone}
                    fillOpacity={0.18}
                    strokeWidth={2}
                    animationDuration={900}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </Reveal>
          <Reveal delay={120} className="space-y-3">
            {DESKTOP_ORDER.map((k) => {
              const f = FRAGRANCES[k];
              return (
                <label key={k} className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-3 transition-all duration-500 ${on[k] ? "border-foreground/30 bg-foreground/5" : "border-border opacity-60"}`}>
                  <Bottle3D k={k} spin={on[k]} className="h-14 w-11" />
                  <span className="flex-1">
                    <span className="font-display block text-xl leading-none">{f.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: f.tone }}>{f.family}</span>
                  </span>
                  <Switch checked={on[k]} onCheckedChange={(v) => setOn((s) => ({ ...s, [k]: v }))} aria-label={`Show ${f.name}`} />
                </label>
              );
            })}
          </Reveal>
        </div>
        <div className="mt-20 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {[
            [5, "", "Spirits"],
            [45, "", "Hand-picked notes"],
            [12, "h", "Longest wear"],
            [100, "%", "Interactive"],
          ].map(([n, s, l], i) => (
            <Reveal key={String(l)} delay={i * 80} className="border-t border-border pt-6">
              <p className="font-display text-6xl md:text-7xl">
                <Counter to={n as number} suffix={s as string} />
              </p>
              <p className="eyebrow-text mt-2">{l}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
