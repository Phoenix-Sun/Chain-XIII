import type { BattleRules, CombatLane } from "./combat";
import { SeededRandom } from "./random";
import type { EquippedGenes, GeneChain, GeneSlot } from "./template";

type GeneRequirement = { slot: GeneSlot; minimumEnabled: number; allEnabled?: boolean };

interface RelicRule {
  id: string;
  label: string;
  detail: string;
  laneBonus?: { lane: CombatLane; minimum: number; maximum: number };
  fixedLaneBonus?: { lane: CombatLane; amount: number };
  allLaneBonus?: number;
  allLaneGeneCondition?: "active" | "disabled";
  geneRequirement?: GeneRequirement;
  disabledBossRuleId?: string;
}

export interface RelicBattleContext {
  seed?: string;
  bossRuleId?: string;
  equippedGenes?: EquippedGenes;
}

const RELIC_RULES: RelicRule[] = [
  { id: "relic-1", label: "前鋒同牌型比較 +2～+4", detail: "每場戰鬥固定一次本場數值；只在頭墩牌型相同時加入比較。", laneBonus: { lane: "front", minimum: 2, maximum: 4 } },
  { id: "relic-2", label: "中堅同牌型比較 +2～+4", detail: "每場戰鬥固定一次本場數值；只在中墩牌型相同時加入比較。", laneBonus: { lane: "middle", minimum: 2, maximum: 4 } },
  { id: "relic-3", label: "尾墩同牌型比較 +2～+4", detail: "每場戰鬥固定一次本場數值；只在尾墩牌型相同時加入比較。", laneBonus: { lane: "back", minimum: 2, maximum: 4 } },
  { id: "relic-4", label: "三墩都有基因鏈時，三墩比較各 +2", detail: "三個墩位都裝備至少一格啟用的基因鏈時生效。", allLaneBonus: 2, allLaneGeneCondition: "active" },
  { id: "relic-5", label: "短鏈全開時，頭墩比較 +4", detail: "頭墩 3 格基因鏈全部啟用時，頭墩同牌型比較 +4。", fixedLaneBonus: { lane: "front", amount: 4 }, geneRequirement: { slot: "short3", minimumEnabled: 3, allEnabled: true } },
  { id: "relic-6", label: "中鏈啟用 3 格以上，中墩比較 +3", detail: "中墩基因鏈至少啟用 3 格時，中墩同牌型比較 +3。", fixedLaneBonus: { lane: "middle", amount: 3 }, geneRequirement: { slot: "long5A", minimumEnabled: 3 } },
  { id: "relic-7", label: "尾鏈啟用 3 格以上，尾墩比較 +3", detail: "尾墩基因鏈至少啟用 3 格時，尾墩同牌型比較 +3。", fixedLaneBonus: { lane: "back", amount: 3 }, geneRequirement: { slot: "long5B", minimumEnabled: 3 } },
  { id: "relic-8", label: "保留原色的墩位比較 +2", detail: "每個含有停用基因格的墩位，同牌型比較 +2；保留原始牌色也能成為 Build。" },
  { id: "relic-9", label: "熔岩巨龜克制：尾墩地元素不被中和", detail: "對熔岩巨龜時，尾墩地元素保留元素克制效果。", disabledBossRuleId: "boss-neutralize-earth" },
  { id: "relic-10", label: "風暴巨鳥克制：阻止牌位互換", detail: "對風暴巨鳥時，敵方不會在開戰時互換兩個模板位置。", disabledBossRuleId: "boss-swap-slots" },
  { id: "relic-11", label: "深海巨獸克制：取消頭墩水域優勢", detail: "對深海巨獸時，頭墩水元素不再觸發 Boss 的額外壓制。", disabledBossRuleId: "boss-water-advantage" },
  { id: "relic-12", label: "三墩都保留原色時，三墩比較各 +3", detail: "三個墩位都至少停用一格基因格時，三墩同牌型比較各 +3。", allLaneBonus: 3, allLaneGeneCondition: "disabled" },
  { id: "relic-13", label: "前後基因鏈同時啟用，前後比較各 +3", detail: "頭墩與尾墩都裝備至少一格啟用的基因鏈時，前後墩同牌型比較各 +3。" },
  { id: "relic-14", label: "中鏈全開時，中墩比較 +4", detail: "中墩 5 格基因鏈全部啟用時，中墩同牌型比較 +4。", fixedLaneBonus: { lane: "middle", amount: 4 }, geneRequirement: { slot: "long5A", minimumEnabled: 5, allEnabled: true } },
  { id: "relic-15", label: "未裝備基因鏈的墩位比較 +3", detail: "沒有裝備基因鏈的墩位，同牌型比較 +3；純原始牌組也有自己的路線。" },
  { id: "relic-16", label: "祭壇第一次 Skull 不計數", detail: "第一次 Skull 仍會鎖定，但不增加爆骰計數。" },
  { id: "relic-17", label: "祭壇小獎勵抗爆骰", detail: "已形成的水晶／祝福小獎勵在爆骰後仍可帶走。" },
  { id: "relic-18", label: "路線直接預覽下一層", detail: "在地圖顯示下一層節點類型，不消耗角色技能。" },
  { id: "relic-19", label: "未用主動技勝利 +6 水晶", detail: "戰鬥勝利時若未使用角色主動技，額外取得 6 水晶。" },
];

function ruleFor(relicId: string): RelicRule | undefined {
  return RELIC_RULES.find((rule) => rule.id === relicId);
}

function enabledCount(chain: GeneChain | undefined): number {
  return chain?.enabledSlots.filter(Boolean).length ?? 0;
}

function meetsGeneRequirement(rule: RelicRule, equippedGenes: EquippedGenes | undefined): boolean {
  if (!rule.geneRequirement) return true;
  const chain = equippedGenes?.[rule.geneRequirement.slot];
  if (!chain) return false;
  const count = enabledCount(chain);
  return count >= rule.geneRequirement.minimumEnabled && (!rule.geneRequirement.allEnabled || count === chain.factors.length);
}

function randomLaneBonus(rule: RelicRule, seed: string): number | undefined {
  if (!rule.laneBonus) return undefined;
  return new SeededRandom(`${seed}:${rule.id}`).int(rule.laneBonus.maximum - rule.laneBonus.minimum + 1) + rule.laneBonus.minimum;
}

export function relicEffectLabel(relicId: string, context: RelicBattleContext = {}): string {
  const rule = ruleFor(relicId);
  if (!rule) return "尚未辨識的遺物效果";
  if (rule.laneBonus && context.seed) return `${rule.label}（本場 +${randomLaneBonus(rule, context.seed)}）`;
  return rule.label;
}

export function relicEffectDetail(relicId: string): string {
  return ruleFor(relicId)?.detail ?? "尚未辨識的遺物效果。";
}

export function relicDisablesBossRule(relicIds: string[], ruleId: string): boolean {
  return relicIds.some((relicId) => ruleFor(relicId)?.disabledBossRuleId === ruleId);
}

export function hasRelic(relicIds: string[], relicId: string): boolean {
  return relicIds.includes(relicId);
}

export function altarRelicModifiers(relicIds: string[]): { ignoreFirstSkull: boolean; protectSmallRewards: boolean } {
  return { ignoreFirstSkull: hasRelic(relicIds, "relic-16"), protectSmallRewards: hasRelic(relicIds, "relic-17") };
}

export function battleVictoryCrystalBonus(relicIds: string[], usedActiveAbility: boolean): number {
  return hasRelic(relicIds, "relic-19") && !usedActiveAbility ? 6 : 0;
}

export function routePreviewRelic(relicIds: string[]): boolean {
  return hasRelic(relicIds, "relic-18");
}

export function battleRulesForRelics(relicIds: string[], context: RelicBattleContext = {}): BattleRules {
  const laneBonuses: Partial<Record<CombatLane, number>> = {};
  const addLaneBonus = (lane: CombatLane, amount: number) => { laneBonuses[lane] = (laneBonuses[lane] ?? 0) + amount; };
  const activeGenes = context.equippedGenes;
  const seed = context.seed ?? "relic-preview";
  for (const relicId of relicIds) {
    const rule = ruleFor(relicId);
    if (!rule || !meetsGeneRequirement(rule, activeGenes)) continue;
    if (rule.laneBonus) addLaneBonus(rule.laneBonus.lane, randomLaneBonus(rule, seed) ?? 0);
    if (rule.fixedLaneBonus) addLaneBonus(rule.fixedLaneBonus.lane, rule.fixedLaneBonus.amount);
    if (rule.allLaneBonus) {
      const chains = [activeGenes?.short3, activeGenes?.long5A, activeGenes?.long5B];
      const condition = rule.allLaneGeneCondition === "disabled"
        ? chains.every((chain) => chain?.enabledSlots.some((enabled) => !enabled))
        : chains.every((chain) => chain?.enabledSlots.some(Boolean));
      if (condition) for (const lane of ["front", "middle", "back"] as CombatLane[]) addLaneBonus(lane, rule.allLaneBonus);
    }
    if (relicId === "relic-8") {
      const chains: Array<[CombatLane, GeneChain | undefined]> = [["front", activeGenes?.short3], ["middle", activeGenes?.long5A], ["back", activeGenes?.long5B]];
      for (const [lane, chain] of chains) if (chain?.enabledSlots.some((enabled) => !enabled)) addLaneBonus(lane, 2);
    }
    if (relicId === "relic-13" && activeGenes?.short3?.enabledSlots.some(Boolean) && activeGenes?.long5B?.enabledSlots.some(Boolean)) {
      addLaneBonus("front", 3);
      addLaneBonus("back", 3);
    }
    if (relicId === "relic-15" && !activeGenes?.long5B) addLaneBonus("back", 3);
  }
  const disabledBossRuleIds = relicIds.map((relicId) => ruleFor(relicId)?.disabledBossRuleId).filter((ruleId): ruleId is string => Boolean(ruleId));
  return disabledBossRuleIds.length > 0 ? { laneBonuses, disabledBossRuleIds } : { laneBonuses };
}