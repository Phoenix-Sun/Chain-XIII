import { describe, expect, it } from "vitest";
import { rollExploration } from "./exploration";

describe("deterministic exploration", () => {
  it("repeats the same dice result for the same event attempt", () => {
    expect(rollExploration("run-seed", "event-1")).toEqual(rollExploration("run-seed", "event-1"));
  });

  it("evaluates sum and pair objectives", () => {
    const sumResult = rollExploration("run-seed", "event-1");
    const pairResult = rollExploration("run-seed", "event-2");
    expect(sumResult.rolls).toHaveLength(3);
    expect(sumResult.success).toBe(sumResult.total >= 9);
    expect(pairResult.success).toBe(pairResult.hasPair);
  });

  it("evaluates straight objectives for every third event", () => {
    const straightResult = rollExploration("run-seed", "event-3");
    const sorted = [...straightResult.rolls].sort((left, right) => left - right);
    const isStraight = sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1;

    expect(straightResult.isStraight).toBe(isStraight);
    expect(straightResult.success).toBe(isStraight);
  });
});
