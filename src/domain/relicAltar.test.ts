import { describe, expect, it } from "vitest";
import { altarRewardPreview, createRelicAltarState, rollAltar, settleAltar, ALTAR_BUST_SKULLS } from "./relicAltar";

describe("relic altar", () => {
  it("counts symbol-specific rewards without turning crystal triples into relics", () => {
    expect(altarRewardPreview(["crystal", "crystal", "crystal", "crystal", "blessing"])).toEqual({ crystalPairs: 2, blessingCount: 0, relicReady: false });
    expect(altarRewardPreview(["relic", "relic", "relic", "blessing", "blessing"])).toEqual({ crystalPairs: 0, blessingCount: 1, relicReady: true });
    expect(altarRewardPreview(["relic", "relic", "crystal", "blessing", "skull"])).toEqual({ crystalPairs: 0, blessingCount: 0, relicReady: false });
  });

  it("keeps rerolls deterministic and never rerolls a locked Skull", () => {
    const first = rollAltar(createRelicAltarState("altar-seed", ["relic-1", "relic-2"]));
    const second = rollAltar(createRelicAltarState("altar-seed", ["relic-1", "relic-2"]));
    expect(first.faces).toEqual(second.faces);
    const locked = { ...first, rollCount: 1, lockedSkullIndices: [0], skullCount: 1, faces: ["skull", "crystal", "blessing", "relic", "crystal"] as Array<"crystal" | "relic" | "blessing" | "skull"> };
    expect(rollAltar(locked, [0, 1]).faces[0]).toBe("skull");
  });

  it("uses a first-Skull grace without changing the fixed three-Skull bust rule", () => {
    const state = createRelicAltarState("altar-grace", ["relic-1", "relic-2"]);
    const first = rollAltar(state, [], true);
    expect(first.lockedSkullIndices.length).toBeGreaterThanOrEqual(first.skullCount);
    expect(first.skullCount).toBeLessThanOrEqual(1);
    const bust = { ...first, status: "bust" as const, skullCount: ALTAR_BUST_SKULLS, pendingRewards: { crystalPairs: 1, blessingCount: 1, relicReady: true } };
    expect(settleAltar(bust)).toMatchObject({ status: "bust", crystalPairs: 0, blessingCount: 0, relicReady: false, nextBattleSkullCurse: 1 });
  });

  it("lets the safe-claim relic protect only formed small rewards", () => {
    const state = { ...createRelicAltarState("safe-altar", ["relic-1", "relic-2"], true), status: "bust" as const, securedRewards: { crystalPairs: 1, blessingCount: 1 }, skullCount: ALTAR_BUST_SKULLS, pendingRewards: { crystalPairs: 2, blessingCount: 2, relicReady: true } };
    expect(settleAltar(state)).toMatchObject({ status: "bust", crystalPairs: 1, blessingCount: 1, relicReady: false, nextBattleSkullCurse: 1 });
  });
});
