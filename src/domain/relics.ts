import type { BattleRules, CombatLane } from "./combat";

interface RelicRule {
  id: string;
  label: string;
  bonuses: Partial<Record<CombatLane, number>>;
}

const RELIC_RULES: RelicRule[] = [
  { id: "relic-1", label: "前鋒同牌型比較 +1", bonuses: { front: 1 } },
  { id: "relic-2", label: "中堅同牌型比較 +1", bonuses: { middle: 1 } },
  { id: "relic-3", label: "尾墩同牌型比較 +1", bonuses: { back: 1 } },
  { id: "relic-4", label: "三墩同牌型比較各 +1", bonuses: { front: 1, middle: 1, back: 1 } },
  { id: "relic-5", label: "前鋒同牌型比較 +2", bonuses: { front: 2 } },
  { id: "relic-6", label: "中堅同牌型比較 +2", bonuses: { middle: 2 } },
  { id: "relic-7", label: "尾墩同牌型比較 +2", bonuses: { back: 2 } },
  { id: "relic-8", label: "三墩同牌型比較各 +2", bonuses: { front: 2, middle: 2, back: 2 } },
  { id: "relic-9", label: "前鋒與中堅同牌型比較各 +1", bonuses: { front: 1, middle: 1 } },
  { id: "relic-10", label: "中堅與尾墩同牌型比較各 +1", bonuses: { middle: 1, back: 1 } },
  { id: "relic-11", label: "前鋒與尾墩同牌型比較各 +1", bonuses: { front: 1, back: 1 } },
  { id: "relic-12", label: "三墩同牌型比較各 +3", bonuses: { front: 3, middle: 3, back: 3 } },
  { id: "relic-13", label: "前鋒同牌型比較 +3", bonuses: { front: 3 } },
  { id: "relic-14", label: "中堅同牌型比較 +3", bonuses: { middle: 3 } },
  { id: "relic-15", label: "尾墩同牌型比較 +3", bonuses: { back: 3 } },
];

export function relicEffectLabel(relicId: string): string {
  return RELIC_RULES.find((rule) => rule.id === relicId)?.label ?? "尚未辨識的遺物效果";
}

export function battleRulesForRelics(relicIds: string[]): BattleRules {
  const laneBonuses: Partial<Record<CombatLane, number>> = {};
  for (const relicId of relicIds) {
    const rule = RELIC_RULES.find((candidate) => candidate.id === relicId);
    if (!rule) continue;
    for (const lane of ["front", "middle", "back"] as CombatLane[]) {
      laneBonuses[lane] = (laneBonuses[lane] ?? 0) + (rule.bonuses[lane] ?? 0);
    }
  }
  return { laneBonuses };
}
