import { describe, expect, it } from "vitest";
import { createStandardDeck } from "./cards";
import { emptyLanes, validateLayout, type Lanes } from "./layout";

const deck = createStandardDeck();
const pick = (index: number) => deck[index];

function validLanes(): Lanes {
  return {
    front: [pick(0), pick(5), pick(10)],
    middle: [pick(1), pick(6), pick(11), pick(16), pick(21)],
    back: [pick(2), pick(7), pick(12), pick(17), pick(22)],
  };
}

describe("3/5/5 layout validation", () => {
  it("starts incomplete", () => {
    const result = validateLayout(emptyLanes());
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(3);
  });

  it("requires every lane to have the correct size", () => {
    const lanes = validLanes();
    lanes.front = lanes.front.slice(0, 2);
    const result = validateLayout(lanes);
    expect(result.errors.some((error) => error.includes("頭墩需要 3 張"))).toBe(true);
  });

  it("rejects duplicate physical cards", () => {
    const lanes = validLanes();
    lanes.back[0] = lanes.front[0];
    const result = validateLayout(lanes);
    expect(result.errors).toContain("同一張牌不能重複放入不同墩位");
  });

  it("returns lane evaluations for a complete layout", () => {
    const result = validateLayout(validLanes());
    expect(result.evaluated?.front).toBeDefined();
    expect(result.evaluated?.middle).toBeDefined();
    expect(result.evaluated?.back).toBeDefined();
  });
});
