import { describe, expect, it } from "vitest";
import { createStandardDeck } from "./cards";
import { beats, resolveLaneElement } from "./elements";
import { applySuitTemplate } from "./template";

const deck = createStandardDeck();

describe("element lane rules", () => {
  it("uses 2/3 and 3/5 thresholds", () => {
    expect(resolveLaneElement([deck[0], deck[13], deck[26]])).toBe(null);
    const three = applySuitTemplate([deck[0], deck[13], deck[26], ...deck.slice(1, 11)], [
      { suit: "water" }, { suit: "water" }, { suit: "fire" },
      ...Array.from({ length: 10 }, () => null),
    ]);
    expect(resolveLaneElement(three.slice(0, 3))).toBe("water");
  });

  it("uses the one-way counter ring only", () => {
    expect(beats("water", "fire")).toBe(true);
    expect(beats("fire", "water")).toBe(false);
    expect(beats("water", "wind")).toBe(false);
    expect(beats(null, "fire")).toBe(false);
  });
});
