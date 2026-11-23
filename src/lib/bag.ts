import { FRAGRANCES, priceFor, type FragranceKey, type Size } from "@/data/fragrances";

export type BagLine = { key: FragranceKey; size: Size; qty: number };
export type Bag = BagLine[];

/** Spending this much unlocks the complimentary discovery set (demo perk). */
export const GIFT_THRESHOLD = 300;

export function addToBag(bag: Bag, key: FragranceKey, size: Size, qty = 1): Bag {
  const found = bag.find((l) => l.key === key && l.size === size);
  if (found) return bag.map((l) => (l === found ? { ...l, qty: l.qty + qty } : l));
  return [...bag, { key, size, qty }];
}

export function changeQty(bag: Bag, key: FragranceKey, size: Size, delta: number): Bag {
  return bag
    .map((l) => (l.key === key && l.size === size ? { ...l, qty: l.qty + delta } : l))
    .filter((l) => l.qty > 0);
}

export function bagCount(bag: Bag) {
  return bag.reduce((n, l) => n + l.qty, 0);
}

export function bagSubtotal(bag: Bag) {
  return bag.reduce((sum, l) => sum + priceFor(l.key, l.size) * l.qty, 0);
}

export function parseBag(raw: unknown): Bag {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (l): l is BagLine =>
      l &&
      typeof l === "object" &&
      l.key in FRAGRANCES &&
      [30, 50, 100].includes(l.size) &&
      Number.isSafeInteger(l.qty) &&
      l.qty > 0,
  );
}
