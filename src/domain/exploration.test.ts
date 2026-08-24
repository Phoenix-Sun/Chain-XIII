import { describe, expect, it } from "vitest";
import { rollExploration } from "./exploration";

describe("low-frequency exploration dice", () => {
  it("replays deterministic dice and evaluates a threshold", () => {
    const first = rollExploration("event-seed", { kind: "sum-at-least", value: 3 });
    expect(first).toEqual(rollExploration("event-seed", { kind: "sum-at-least", value: 3 }));
    expect(first.values).toHaveLength(3);
    expect(first.success).toBe(true);
  });

  it("supports a compact pair objective", () => {
    const result = rollExploration("pair-seed", { kind: "pair" }, 5);
    expect(result.values).toHaveLength(5);
    expect(typeof result.success).toBe("boolean");
  });
});
