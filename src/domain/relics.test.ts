import { describe, expect, it } from "vitest";
import { battleRulesForRelics, relicEffectLabel } from "./relics";

const genes = {
  short3: { id: "short", targetSlot: "short3" as const, factors: [{ suit: "water" as const }, { suit: "fire" as const }, { suit: "wind" as const }], enabledSlots: [true, true, true] },
  long5A: { id: "middle", targetSlot: "long5A" as const, factors: Array.from({ length: 5 }, () => ({ suit: "water" as const })), enabledSlots: [true, true, true, false, false] },
  long5B: { id: "back", targetSlot: "long5B" as const, factors: Array.from({ length: 5 }, () => ({ suit: "earth" as const })), enabledSlots: [true, true, true, true, true] },
};

describe("run relic effects", () => {
  it("gives lane relics a stable per-battle bonus in the +2 to +4 range", () => {
    const first = battleRulesForRelics(["relic-1", "relic-2", "relic-3"], { seed: "battle-seed" });
    expect(first).toEqual(battleRulesForRelics(["relic-1", "relic-2", "relic-3"], { seed: "battle-seed" }));
    expect(first.laneBonuses?.front).toBeGreaterThanOrEqual(2);
    expect(first.laneBonuses?.front).toBeLessThanOrEqual(4);
    expect(first.laneBonuses?.middle).toBeGreaterThanOrEqual(2);
    expect(first.laneBonuses?.middle).toBeLessThanOrEqual(4);
    expect(first.laneBonuses?.back).toBeGreaterThanOrEqual(2);
    expect(first.laneBonuses?.back).toBeLessThanOrEqual(4);
    expect(relicEffectLabel("relic-2", { seed: "battle-seed" })).toMatch(/本場 \+[2-4]/);
  });

  it("ignores unknown relic IDs without breaking a battle", () => {
    expect(battleRulesForRelics(["missing-relic"])).toEqual({ laneBonuses: {} });
    expect(relicEffectLabel("missing-relic")).toBe("尚未辨識的遺物效果");
  });

  it("activates gene-chain synergies only when their configuration is present", () => {
    expect(battleRulesForRelics(["relic-4", "relic-5", "relic-6", "relic-7", "relic-8", "relic-13"], { equippedGenes: genes }).laneBonuses).toEqual({ front: 9, middle: 7, back: 8 });
    expect(battleRulesForRelics(["relic-5", "relic-6", "relic-7"], {}).laneBonuses).toEqual({});
  });

  it("supports both all-disabled and all-enabled gene builds", () => {
    const mixedGenes = {
      short3: { ...genes.short3, enabledSlots: [true, false, true] },
      long5A: { ...genes.long5A, enabledSlots: [true, true, true, false, true] },
      long5B: { ...genes.long5B, enabledSlots: [true, true, true, true, false] },
    };
    expect(battleRulesForRelics(["relic-4", "relic-8", "relic-12"], { equippedGenes: mixedGenes }).laneBonuses).toEqual({ front: 7, middle: 7, back: 7 });
    expect(battleRulesForRelics(["relic-14"], { equippedGenes: { long5A: { ...genes.long5A, enabledSlots: [true, true, true, true, true] } } }).laneBonuses).toEqual({ middle: 4 });
  });

  it("exposes boss counters as battle rule suppressions", () => {
    expect(battleRulesForRelics(["relic-9", "relic-10", "relic-11"]).disabledBossRuleIds).toEqual(["boss-neutralize-earth", "boss-swap-slots", "boss-water-advantage"]);
  });
});