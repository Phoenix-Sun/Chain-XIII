import { describe, expect, it } from "vitest";
import { createStandardDeck } from "./cards";
import { compareHandRanks, evaluateHand } from "./hands";

const deck = createStandardDeck();
const card = (suit: "water" | "fire" | "wind" | "earth", rank: number) => deck.find((item) => item.suit === suit && item.rank === rank)!;

const cards = (...pairs: Array<["water" | "fire" | "wind" | "earth", number]>) => pairs.map(([suit, rank]) => card(suit, rank));

describe("hand evaluation", () => {
  it("evaluates three-card front lanes", () => {
    expect(evaluateHand(cards(["water", 7], ["fire", 7], ["wind", 2])).category).toBe("pair");
    expect(evaluateHand(cards(["water", 9], ["fire", 9], ["wind", 9])).category).toBe("three-of-a-kind");
  });

  it("evaluates the five-card categories", () => {
    expect(evaluateHand(cards(["water", 2], ["fire", 2], ["wind", 2], ["earth", 9], ["water", 9])).category).toBe("full-house");
    expect(evaluateHand(cards(["water", 5], ["water", 6], ["water", 7], ["water", 8], ["water", 9])).category).toBe("straight-flush");
    expect(evaluateHand(cards(["water", 1], ["fire", 2], ["wind", 3], ["earth", 4], ["water", 5])).category).toBe("straight");
  });

  it("uses category before high-card tiebreakers", () => {
    const pair = evaluateHand(cards(["water", 4], ["fire", 4], ["wind", 13], ["earth", 8], ["water", 2]));
    const highCard = evaluateHand(cards(["water", 1], ["fire", 13], ["wind", 10], ["earth", 8], ["water", 7]));
    expect(compareHandRanks(pair, highCard)).toBeGreaterThan(0);
  });

  it("rejects unsupported hand sizes", () => {
    expect(() => evaluateHand(cards(["water", 2], ["fire", 3]))).toThrow("3 張或 5 張");
  });
});
