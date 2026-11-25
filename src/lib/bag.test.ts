import { describe, expect, it } from "vitest";
import { FRAGRANCES, priceFor } from "@/data/fragrances";
import { addToBag, bagCount, bagSubtotal, changeQty, GIFT_THRESHOLD } from "@/lib/bag";

describe("fragrance prices", () => {
  it("keeps the original 100 ml prices", () => {
    expect(FRAGRANCES.galet.price).toBe(175);
    expect(FRAGRANCES.rose.price).toBe(185);
    expect(FRAGRANCES.iris.price).toBe(195);
    expect(FRAGRANCES.terre.price).toBe(205);
    expect(FRAGRANCES.nacre.price).toBe(190);
  });

  it("charges the full price for 100 ml and less for smaller bottles", () => {
    expect(priceFor("iris", 100)).toBe(195);
    expect(priceFor("iris", 50)).toBe(120);
    expect(priceFor("iris", 30)).toBe(80);
  });
});

describe("bag", () => {
  it("adds up quantities and the subtotal", () => {
    let bag = addToBag([], "rose", 100);
    bag = addToBag(bag, "rose", 100);
    bag = addToBag(bag, "galet", 100);
    expect(bagCount(bag)).toBe(3);
    expect(bagSubtotal(bag)).toBe(185 * 2 + 175);
  });

  it("removes a line when its quantity reaches zero", () => {
    const bag = changeQty(addToBag([], "nacre", 100), "nacre", 100, -1);
    expect(bag).toEqual([]);
  });

  it("unlocks the gift at €300", () => {
    expect(GIFT_THRESHOLD).toBe(300);
  });
});
