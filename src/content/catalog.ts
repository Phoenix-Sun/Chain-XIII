import type { Suit } from "../domain/cards";
import type { GeneFactor, GeneChain } from "../domain/template";
import type { CharacterDefinition, ContentCatalog, ExplorationEventDefinition, MonsterDefinition, RelicDefinition } from "./types";
import { objectiveForEvent, objectiveLabel } from "../domain/exploration";

const SUITS: Suit[] = ["water", "fire", "wind", "earth"];
const factor = (index: number): GeneFactor => ({ suit: SUITS[index % SUITS.length], tier: (index % 3) + 1 as 1 | 2 | 3 });

export const characters: CharacterDefinition[] = [
  ["water-scout", "R", "water", "ability-ripple", "情報與控牌"], ["fire-smith", "R", "fire", "ability-forge", "鍊成與爆發"], ["wind-oracle", "SR", "wind", "ability-sight", "預測與重抽"],
  ["earth-guard", "R", "earth", "ability-shell", "容錯與防守"], ["tide-scholar", "SR", "water", "ability-flow", "元素轉位"], ["ember-duelist", "SR", "fire", "ability-spark", "頭墩突破"],
  ["gale-merchant", "SSR", "wind", "ability-trade", "掉落選擇"], ["stone-cartographer", "SR", "earth", "ability-map", "節點情報"], ["fourfold-master", "SSR", undefined, "ability-harmony", "三墩調度"],
].map(([id, rarity, specialization, activeAbilityId, role]) => ({ id: id as string, rarity: rarity as CharacterDefinition["rarity"], specialization: specialization as Suit | undefined, activeAbilityId: activeAbilityId as string, passiveAbilityIds: [], role: role as string }));

export const geneChains: GeneChain[] = [
  { id: "gene-water-fire-wind", factors: [factor(0), factor(1), factor(2)] }, { id: "gene-earth-water-fire", factors: [factor(3), factor(0), factor(1), factor(2), factor(3)] },
  { id: "gene-fire-wind-earth-water-fire", factors: [factor(1), factor(2), factor(3), factor(0), factor(1)] }, { id: "gene-wind-earth-water-fire-earth", factors: [factor(2), factor(3), factor(0), factor(1), factor(3)] },
  { id: "gene-boss-water-fire", factors: [factor(0), factor(1), factor(0)] }, { id: "gene-boss-earth-wind", factors: [factor(3), factor(2), factor(3)] },
];

function monster(id: string, kind: MonsterDefinition["kind"], index: number, bossRuleId?: string): MonsterDefinition {
  return { id, kind, template13: Array.from({ length: 13 }, (_, slot) => factor(slot + index)), dropChainPoolIds: geneChains.map((chain) => chain.id).slice(0, kind === "boss" ? 2 : kind === "elite" ? 3 : 2), aiProfileId: kind === "boss" ? "ai-boss" : kind === "elite" ? "ai-elite" : "ai-basic", bossRuleId, name: id.replaceAll("-", " ") };
}

export const monsters: MonsterDefinition[] = [
  ...Array.from({ length: 12 }, (_, index) => monster(`monster-normal-${index + 1}`, "normal", index)), ...Array.from({ length: 4 }, (_, index) => monster(`monster-elite-${index + 1}`, "elite", index + 12)),
  monster("boss-lava-turtle", "boss", 16, "boss-neutralize-earth"), monster("boss-storm-bird", "boss", 17, "boss-swap-slots"), monster("boss-deep-sea", "boss", 18, "boss-water-advantage"),
];
const RELIC_NAMES = ["赤曜前鋒", "雙月中堅", "沉星尾墩", "三相羅盤", "王冠火炬", "深潮印記", "裂地長釘", "四象核心", "晨星徽章", "暮色徽章", "交界護符", "天穹王座", "赤王之眼", "潮汐王冠", "大地脈輪"];
export const relics: RelicDefinition[] = Array.from({ length: 15 }, (_, index) => ({ id: `relic-${index + 1}`, rarity: index < 8 ? "common" : index < 13 ? "rare" : "legendary", passiveEffectIds: [`relic-effect-${index + 1}`], name: RELIC_NAMES[index] }));
export const events: ExplorationEventDefinition[] = Array.from({ length: 12 }, (_, index) => {
  const objective = objectiveForEvent(`event-${index + 1}`);
  return { id: `event-${index + 1}`, name: `城外傳聞 ${index + 1}`, content: objective === "straight" ? "三顆骰子在石桌上排成一線，遠處的路標逐一亮起。" : "骰子在石桌上滾動，新的路線露出一角。", objective: objectiveLabel(objective), rewardIds: [geneChains[index % geneChains.length].id, relics[index % relics.length].id] };
});
export const catalog: ContentCatalog = { characters, monsters, geneChains, relics, events };
