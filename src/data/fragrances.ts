export type FragranceKey = "galet" | "rose" | "iris" | "terre" | "nacre";

export type Metrics = {
  freshness: number;
  floral: number;
  woody: number;
  smoky: number;
  longevity: number;
  sillage: number;
};

export type Fragrance = {
  key: FragranceKey;
  name: string;
  first: string;
  second?: string;
  family: string;
  desc: string;
  /** Price of the 100 ml bottle in euros. */
  price: number;
  img: string;
  num: string;
  tone: string;
  notes: { top: string[]; heart: string[]; base: string[] };
  day: string;
  night: string;
  metrics: Metrics;
  moods: Mood[];
  moment: "day" | "night" | "both";
  intensity: number;
};

export type Mood = "fresh" | "floral" | "woody" | "smoky" | "mineral";

const base = import.meta.env.BASE_URL;
export const asset = (path: string) => `${base}${path.replace(/^\//, "")}`;

export const FRAGRANCES: Record<FragranceKey, Fragrance> = {
  galet: {
    key: "galet",
    name: "Galet",
    first: "Galet",
    family: "Green · Aromatic",
    desc: "Fig leaf, green tea and white woods.",
    price: 175,
    img: asset("showroom/galet-smoked.png"),
    num: "01 / 05",
    tone: "var(--tone-galet)",
    notes: {
      top: ["Fig leaf", "Bergamot", "Green tea"],
      heart: ["Crushed basil", "Mate", "Neroli"],
      base: ["White woods", "Musk", "Oakmoss"],
    },
    day: "A walk through a wet orchard at 8am — crisp, green and quietly bright.",
    night: "Cool linen and open windows; a calm, clean trail after dark.",
    metrics: { freshness: 92, floral: 30, woody: 55, smoky: 8, longevity: 58, sillage: 52 },
    moods: ["fresh", "mineral"],
    moment: "day",
    intensity: 35,
  },
  rose: {
    key: "rose",
    name: "Rose Lune",
    first: "Rose",
    second: "Lune",
    family: "Floral · Spiced",
    desc: "Pink pepper, velvet rose and cashmere wood.",
    price: 185,
    img: asset("showroom/rose-lune-smoked.png"),
    num: "02 / 05",
    tone: "var(--tone-rose)",
    notes: {
      top: ["Pink pepper", "Lychee", "Saffron"],
      heart: ["Velvet rose", "Peony", "Raspberry"],
      base: ["Cashmere wood", "Amber", "Patchouli"],
    },
    day: "Petals warmed by afternoon sun, a sparkle of pepper on the skin.",
    night: "Moonlit roses and soft cashmere — a slow, magnetic glow.",
    metrics: { freshness: 40, floral: 95, woody: 52, smoky: 18, longevity: 78, sillage: 74 },
    moods: ["floral"],
    moment: "both",
    intensity: 65,
  },
  iris: {
    key: "iris",
    name: "Iris Noir",
    first: "Iris",
    second: "Noir",
    family: "Powdery · Tea",
    desc: "Orris butter, violet leaf and black tea.",
    price: 195,
    img: asset("showroom/iris.png"),
    num: "03 / 05",
    tone: "var(--tone-iris)",
    notes: {
      top: ["Violet leaf", "Cardamom", "Black tea"],
      heart: ["Orris butter", "Heliotrope", "Ink accord"],
      base: ["Suede", "Vetiver", "Tonka"],
    },
    day: "Library afternoons: powder, paper and a cup of smoky tea.",
    night: "Velvet curtains and violet light — intimate, enigmatic, close.",
    metrics: { freshness: 45, floral: 70, woody: 60, smoky: 40, longevity: 82, sillage: 60 },
    moods: ["floral", "woody"],
    moment: "night",
    intensity: 60,
  },
  terre: {
    key: "terre",
    name: "Terre Fumée",
    first: "Terre",
    second: "Fumée",
    family: "Smoky · Woody",
    desc: "Tobacco leaf, dry cedar and smoked vetiver.",
    price: 205,
    img: asset("showroom/grenat.png"),
    num: "04 / 05",
    tone: "var(--tone-terre)",
    notes: {
      top: ["Black pepper", "Clove", "Bitter orange"],
      heart: ["Tobacco leaf", "Leather", "Birch tar"],
      base: ["Dry cedar", "Smoked vetiver", "Labdanum"],
    },
    day: "A sunlit cedar workshop — dry, warm and confident.",
    night: "Embers, leather armchairs and a lingering trail of smoke.",
    metrics: { freshness: 15, floral: 12, woody: 94, smoky: 96, longevity: 95, sillage: 90 },
    moods: ["woody", "smoky"],
    moment: "night",
    intensity: 92,
  },
  nacre: {
    key: "nacre",
    name: "Nacre",
    first: "Nacre",
    family: "Marine · Mineral",
    desc: "Sea salt, white iris and sandalwood.",
    price: 190,
    img: asset("showroom/nacre.png"),
    num: "05 / 05",
    tone: "var(--tone-nacre)",
    notes: {
      top: ["Sea salt", "Pear", "Aldehydes"],
      heart: ["White iris", "Ambrette", "Water lily"],
      base: ["Sandalwood", "Driftwood", "Ambergris"],
    },
    day: "Salt on warm skin and pearly morning light over the water.",
    night: "A quiet shoreline under starlight — luminous and soft.",
    metrics: { freshness: 85, floral: 55, woody: 48, smoky: 10, longevity: 66, sillage: 55 },
    moods: ["fresh", "mineral", "floral"],
    moment: "both",
    intensity: 45,
  },
};

/** Desktop shelf order (left to right). */
export const DESKTOP_ORDER: FragranceKey[] = ["galet", "rose", "iris", "terre", "nacre"];
/** Phone shelf order — the original stacked phone layout. */
export const PHONE_ORDER: FragranceKey[] = ["terre", "rose", "galet", "iris", "nacre"];
export const PHONE_QUERY = "(max-width:679px) and (orientation:portrait)";

export const SIZES = [30, 50, 100] as const;
export type Size = (typeof SIZES)[number];

const SIZE_FACTOR: Record<Size, number> = { 30: 0.42, 50: 0.62, 100: 1 };

/** Illustrative price for a bottle size, rounded to the nearest €5. */
export function priceFor(key: FragranceKey, size: Size): number {
  const full = FRAGRANCES[key].price;
  if (size === 100) return full;
  return Math.round((full * SIZE_FACTOR[size]) / 5) * 5;
}

export const MOODS: { id: Mood; label: string }[] = [
  { id: "fresh", label: "Fresh" },
  { id: "floral", label: "Floral" },
  { id: "woody", label: "Woody" },
  { id: "smoky", label: "Smoky" },
  { id: "mineral", label: "Mineral" },
];

/** Rank fragrances for the scent finder. Returns 0–100 match scores, best first. */
export function rankFragrances(prefs: { moment: "day" | "night"; moods: Mood[]; intensity: number }) {
  return DESKTOP_ORDER.map((key) => {
    const f = FRAGRANCES[key];
    let score = 40;
    if (f.moment === prefs.moment) score += 22;
    else if (f.moment === "both") score += 14;
    const overlap = prefs.moods.filter((m) => f.moods.includes(m)).length;
    score += prefs.moods.length ? (overlap / prefs.moods.length) * 28 : 14;
    score += 10 - Math.abs(f.intensity - prefs.intensity) / 10;
    return { key, score: Math.max(8, Math.min(99, Math.round(score))) };
  }).sort((a, b) => b.score - a.score);
}
