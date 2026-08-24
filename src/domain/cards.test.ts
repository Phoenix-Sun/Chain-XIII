import { describe, expect, it } from "vitest";
import { createStandardDeck, drawThirteen, rankLabel, shuffleDeck } from "./cards";

describe("cards", () => {
  it("creates a unique standard 52-card deck", () => {
    const deck = createStandardDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => card.id)).size).toBe(52);
  });

  it("draws a deterministic hand from a seed", () => {
    const first = drawThirteen("alpha-seed");
    const second = drawThirteen("alpha-seed");
    expect(first).toEqual(second);
    expect(first).toHaveLength(13);
    expect(new Set(first.map((card) => card.id)).size).toBe(13);
  });

  it("changes the draw when the seed changes", () => {
    expect(shuffleDeck(createStandardDeck(), "seed-a")).not.toEqual(shuffleDeck(createStandardDeck(), "seed-b"));
  });

  it("uses standard card labels", () => {
    expect(rankLabel(1)).toBe("A");
    expect(rankLabel(10)).toBe("10");
    expect(rankLabel(13)).toBe("K");
  });
});
