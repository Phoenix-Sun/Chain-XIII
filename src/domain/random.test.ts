import { describe, expect, it } from "vitest";
import { SeededRandom } from "./random";

describe("SeededRandom", () => {
  it("replays the same sequence for the same seed", () => {
    const left = new SeededRandom("seed");
    const right = new SeededRandom("seed");
    expect(Array.from({ length: 5 }, () => left.next())).toEqual(Array.from({ length: 5 }, () => right.next()));
  });

  it("returns bounded integer values and rejects invalid bounds", () => {
    const random = new SeededRandom("bounds");
    expect(Array.from({ length: 20 }, () => random.int(3)).every((value) => value >= 0 && value < 3)).toBe(true);
    expect(() => random.int(0)).toThrow("正整數");
  });
});
