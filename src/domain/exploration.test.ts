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
});
