import type { BattleRules, CombatLane } from "./combat";

export interface BlessingDefinition {
  id: string;
  name: string;
  trigger: string;
  effect: string;
  detail: string;
}

export const blessings: BlessingDefinition[] = [
  { id: "blessing-1", name: "石膚祝福", trigger: "下一場戰鬥・三墩比較", effect: "三墩同牌型比較各 +1", detail: "只維持到下一場十三支戰鬥結束。" },
  { id: "blessing-2", name: "先手祝福", trigger: "下一場戰鬥・頭墩比較", effect: "頭墩同牌型比較 +2", detail: "適合在需要搶下頭墩時使用。" },
  { id: "blessing-3", name: "餘燼祝福", trigger: "下一場戰鬥・尾墩比較", effect: "尾墩同牌型比較 +2", detail: "不改變元素克制，只影響同牌型比較。" },
];

export function blessingForId(id: string): BlessingDefinition | undefined {
  return blessings.find((blessing) => blessing.id === id);
}

export function blessingIdsForCount(count: number, seed = "blessing"): string[] {
  return Array.from({ length: count }, (_, index) => blessings[(seed.length + index) % blessings.length].id);
}

export function battleRulesForBlessings(blessingIds: string[]): Pick<BattleRules, "laneBonuses"> {
  const laneBonuses: Partial<Record<CombatLane, number>> = {};
  const add = (lane: CombatLane, amount: number) => { laneBonuses[lane] = (laneBonuses[lane] ?? 0) + amount; };
  for (const id of blessingIds) {
    if (id === "blessing-1") for (const lane of ["front", "middle", "back"] as CombatLane[]) add(lane, 1);
    if (id === "blessing-2") add("front", 2);
    if (id === "blessing-3") add("back", 2);
  }
  return { laneBonuses };
}
