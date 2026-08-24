import type { Card, Suit } from "./cards";

export type GeneTier = 1 | 2 | 3;

export interface GeneFactor {
  suit: Suit;
  tier: GeneTier;
}

export interface GeneChain {
  id: string;
  factors: GeneFactor[];
  sourceMonsterId?: string;
}

export interface EquippedGenes {
  short3?: GeneChain;
  long5A?: GeneChain;
  long5B?: GeneChain;
}

export type TemplateSlot = GeneFactor | null;

export interface TemplateCard extends Card {
  originalSuit: Suit;
  currentSuit: Suit;
}

function getSlotFactors(chain: GeneChain | undefined, expectedLength: number): TemplateSlot[] {
  if (!chain) return Array.from({ length: expectedLength }, () => null);
  if (chain.factors.length !== expectedLength) throw new Error(`裝備鏈長度必須是 ${expectedLength}`);
  return [...chain.factors];
}

export function buildSuitTemplate(equipped: EquippedGenes): TemplateSlot[] {
  return [
    ...getSlotFactors(equipped.short3, 3),
    ...getSlotFactors(equipped.long5A, 5),
    ...getSlotFactors(equipped.long5B, 5),
  ];
}

export function currentSuitOf(card: Card | TemplateCard): Suit {
  return "currentSuit" in card ? card.currentSuit : card.suit;
}

export function applySuitTemplate(cards: Card[], template: TemplateSlot[]): TemplateCard[] {
  if (cards.length !== 13 || template.length !== 13) throw new Error("花色模板與牌組都必須是 13 格");
  return cards.map((card, index) => ({
    ...card,
    originalSuit: card.suit,
    currentSuit: template[index]?.suit ?? card.suit,
  }));
}
