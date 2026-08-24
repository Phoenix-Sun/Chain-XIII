import type { GeneFactor, GeneChain } from "../domain/template";
import type { Suit } from "../domain/cards";

export interface CharacterDefinition { id: string; rarity: "R" | "SR" | "SSR"; specialization?: Suit; activeAbilityId: string; passiveAbilityIds: string[]; role: string; }
export interface MonsterDefinition { id: string; kind: "normal" | "elite" | "boss"; template13: GeneFactor[]; dropChainPoolIds: string[]; aiProfileId: string; bossRuleId?: string; name: string; }
export interface RelicDefinition { id: string; rarity: "common" | "rare" | "legendary"; passiveEffectIds: string[]; oneShotActiveEffectId?: string; name: string; }
export interface ExplorationEventDefinition { id: string; name: string; content: string; objective: string; rewardIds: string[]; }
export interface ContentCatalog { characters: CharacterDefinition[]; monsters: MonsterDefinition[]; geneChains: GeneChain[]; relics: RelicDefinition[]; events: ExplorationEventDefinition[]; }
