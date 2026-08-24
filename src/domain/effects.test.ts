import { describe, expect, it } from "vitest";
import { executeEffect } from "./effects";
import { createRunState } from "./run";

describe("data-driven effect lifecycle", () => {
  it("applies a character effect once and records it on RunState", () => {
    const run = createRunState("effect-seed", ["water-scout", "fire-smith", "wind-oracle"]);
    const first = executeEffect("ability-ripple", { phase: "battle-ready", run, sourceId: "water-scout" });
    expect(first.applied).toBe(true);
    expect(first.run.discoveredRunFlags).toContain("effect:ability-ripple");
    const second = executeEffect("ability-ripple", { phase: "battle-ready", run: first.run, sourceId: "water-scout" });
    expect(second.applied).toBe(false);
  });

  it("rejects effects in the wrong lifecycle phase", () => {
    const run = createRunState("effect-phase", ["a", "b", "c"]);
    const result = executeEffect("ability-forge", { phase: "battle-ready", run, sourceId: "fire-smith" });
    expect(result.applied).toBe(false);
    expect(result.messages[0]).toContain("不能在 battle-ready");
  });
});
