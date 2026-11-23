const WORDS = ["Fig leaf", "Velvet rose", "Orris butter", "Smoked vetiver", "Sea salt", "Black tea", "Cashmere wood", "Tobacco leaf", "White iris", "Pink pepper"];

export function Marquee() {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="relative overflow-hidden border-y border-border bg-basalt-deep py-6" aria-hidden>
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-4xl md:text-6xl">
            <span className={i % 2 ? "text-gradient-ink italic" : "text-foreground/80"}>{w}</span>
            <span className="text-lg text-primary">✦</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-basalt-deep to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-basalt-deep to-transparent" />
    </div>
  );
}
