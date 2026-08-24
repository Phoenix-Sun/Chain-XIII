import { describe, expect, it } from "vitest";
import { createStandardDeck } from "./cards";
import { evaluateHand } from "./hands";
import { applySuitTemplate } from "./template";

describe("current suit evaluation", () => {
  it("uses converted suits for flush detection while retaining original suits", () => {
    const deck = createStandardDeck();
    const cards = [deck[0], deck[14], deck[28], deck[42], deck[5], ...deck.slice(1, 9)];
    const converted = applySuitTemplate(cards, Array.from({ length: 13 }, () => ({ suit: "water" as const, tier: 1 as const })));
    expect(cards.some((card) => card.suit !== "water")).toBe(true);
    expect(evaluateHand(converted.slice(0, 5)).category).toBe("flush");
    expect(converted.every((card) => card.currentSuit === "water")).toBe(true);
    expect(converted[1].originalSuit).toBe("fire");
  });
});
