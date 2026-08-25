import { describe, expect, it } from "vitest";
import { battleRulesForRelics, relicEffectLabel } from "./relics";

describe("run relic effects", () => {
  it("translates collected relics into transparent lane bonuses", () => {
    expect(battleRulesForRelics(["relic-1", "relic-2", "relic-3"])).toEqual({ laneBonuses: { front: 1, middle: 1, back: 1 } });
  });

  it("ignores unknown relic IDs without breaking a battle", () => {
    expect(battleRulesForRelics(["missing-relic"])).toEqual({ laneBonuses: {} });
    expect(relicEffectLabel("missing-relic")).toBe("尚未辨識的遺物效果");
  });
});