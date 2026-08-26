import { describe, expect, it } from "vitest";
import { rewardForNode, rewardMultiplierForDifficulty, scaleRewardCrystals } from "./runRewards";
import type { RunMapNode } from "./map";

const node = (type: RunMapNode["type"]): RunMapNode => ({
  id: type,
  row: 1,
  column: 0,
  type,
  monsterId: type === "boss" ? "boss-lava-turtle" : type === "elite" ? "monster-elite-1" : type === "battle" ? "monster-normal-1" : undefined,
  relicId: type === "relic" ? "relic-1" : undefined,
  eventId: type === "event" ? "event-1" : undefined,
  nextNodeIds: [],
});

describe("difficulty reward scaling", () => {
  it("uses clearly different risk-reward multipliers", () => {
    expect(rewardMultiplierForDifficulty("easy")).toBe(0.75);
    expect(rewardMultiplierForDifficulty("normal")).toBe(1);
    expect(rewardMultiplierForDifficulty("hard")).toBe(1.5);
    expect(scaleRewardCrystals(80, "easy")).toBe(60);
    expect(scaleRewardCrystals(80, "normal")).toBe(80);
    expect(scaleRewardCrystals(80, "hard")).toBe(120);
  });

  it("scales every Run node reward, not just ordinary battles", () => {
    for (const type of ["battle", "elite", "event", "relic", "boss"] as const) {
      const easy = rewardForNode(node(type), "easy").crystals;
      const normal = rewardForNode(node(type), "normal").crystals;
      const hard = rewardForNode(node(type), "hard").crystals;
      expect(easy).toBeLessThan(normal);
      expect(normal).toBeLessThan(hard);
    }
  });
});
