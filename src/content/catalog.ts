import type { Suit } from "../domain/cards";
import type { GeneFactor, GeneChain } from "../domain/template";
import type { CharacterDefinition, ContentCatalog, ExplorationEventDefinition, MonsterDefinition, RelicDefinition } from "./types";

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
export const relics: RelicDefinition[] = Array.from({ length: 15 }, (_, index) => ({ id: `relic-${index + 1}`, rarity: index < 8 ? "common" : index < 13 ? "rare" : "legendary", passiveEffectIds: [`relic-effect-${index + 1}`], name: `古代神器 ${index + 1}` }));
export const events: ExplorationEventDefinition[] = Array.from({ length: 12 }, (_, index) => ({ id: `event-${index + 1}`, name: `城外傳聞 ${index + 1}`, content: "骰子在石桌上滾動，新的路線露出一角。", objective: index % 2 === 0 ? "總和達到 9" : "配置一組相同點數", rewardIds: [geneChains[index % geneChains.length].id, relics[index % relics.length].id] }));
export const catalog: ContentCatalog = { characters, monsters, geneChains, relics, events };
