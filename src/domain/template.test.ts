import { describe, expect, it } from "vitest";
import { createStandardDeck, drawThirteen } from "./cards";
import { applySuitTemplate, buildSuitTemplate, currentSuitOf, type EquippedGenes } from "./template";

const factor = (suit: "water" | "fire" | "wind" | "earth", tier: 1 | 2 | 3 = 1) => ({ suit, tier });

describe("13-slot suit templates", () => {
  it("builds 3/5/5 slots and keeps empty slots neutral", () => {
    const equipped: EquippedGenes = { short3: { id: "a", factors: [factor("water"), factor("fire"), factor("wind")] } };
    const template = buildSuitTemplate(equipped);
    expect(template).toHaveLength(13);
    expect(template.slice(0, 3).map((item) => item?.suit)).toEqual(["water", "fire", "wind"]);
    expect(template.slice(3).every((item) => item === null)).toBe(true);
  });

  it("changes current suit without changing original suit or physical identity", () => {
    const cards = drawThirteen("template-seed");
    const converted = applySuitTemplate(cards, Array.from({ length: 13 }, () => factor("water")));
    expect(converted).toHaveLength(13);
    expect(converted[0].id).toBe(cards[0].id);
    expect(converted[0].originalSuit).toBe(cards[0].suit);
    expect(currentSuitOf(converted[0])).toBe("water");
    expect(cards[0].suit).not.toBeUndefined();
  });

  it("rejects a non-13-card template application", () => {
    expect(() => applySuitTemplate(createStandardDeck().slice(0, 12), [])).toThrow("13 格");
  });
});
