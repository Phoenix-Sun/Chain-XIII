import { describe, expect, it } from "vitest";
import { createStandardDeck } from "./cards";
import { emptyLanes, fillLastOpenLane, swapLanes, validateLayout, type Lanes } from "./layout";

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

  it("swaps middle and back without changing card identity", () => {
    const lanes = validLanes();
    const swapped = swapLanes(lanes, "middle", "back");
    expect(swapped.front).toEqual(lanes.front);
    expect(swapped.middle).toEqual(lanes.back);
    expect(swapped.back).toEqual(lanes.middle);
  });

  it("fills the only empty lane when the remaining hand matches its size", () => {
    const lanes = { ...emptyLanes(), front: [pick(0), pick(1), pick(2)], middle: [pick(3), pick(4), pick(5), pick(6), pick(7)] };
    const result = fillLastOpenLane(lanes, [pick(8), pick(9), pick(10), pick(11), pick(12)]);
    expect(result?.lane).toBe("back");
    expect(result?.lanes.back).toEqual([pick(8), pick(9), pick(10), pick(11), pick(12)]);
  });

  it("fills a three-card front lane after ten cards are assigned", () => {
    const lanes = { ...emptyLanes(), middle: [pick(0), pick(1), pick(2), pick(3), pick(4)], back: [pick(5), pick(6), pick(7), pick(8), pick(9)] };
    expect(fillLastOpenLane(lanes, [pick(10), pick(11), pick(12)])?.lane).toBe("front");
  });
});
