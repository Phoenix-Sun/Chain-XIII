import type { GeneFactor, GeneChain } from "../domain/template";
import type { Suit } from "../domain/cards";
import type { BlessingDefinition } from "../domain/blessings";

export interface CharacterDefinition { id: string; rarity: "R" | "SR" | "SSR"; specialization?: Suit; activeAbilityId: string; passiveAbilityIds: string[]; role: string; }
export interface MonsterDefinition { id: string; kind: "normal" | "elite" | "boss"; template13: GeneFactor[]; dropChainPoolIds: string[]; aiProfileId: string; bossRuleId?: string; name: string; }
export type RelicCategory = "battle" | "altar" | "route" | "economy";
export interface RelicDefinition { id: string; rarity: "common" | "rare" | "legendary"; category: RelicCategory; passiveEffectIds: string[]; oneShotActiveEffectId?: string; name: string; trigger: string; effect: string; detail: string; }
export interface ExplorationEventDefinition { id: string; name: string; content: string; objective: string; successText: string; failureText: string; rewardIds: string[]; }
export interface ContentCatalog { characters: CharacterDefinition[]; monsters: MonsterDefinition[]; geneChains: GeneChain[]; relics: RelicDefinition[]; blessings: BlessingDefinition[]; events: ExplorationEventDefinition[]; }
