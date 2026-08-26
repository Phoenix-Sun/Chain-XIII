import type { Card, Suit } from "./cards";

export type GeneSlot = "short3" | "long5A" | "long5B";

export interface GeneFactor {
  suit: Suit;
}

export interface GeneChain {
  id: string;
  /** The lane is part of the drop; chains are not moved between lanes. */
  targetSlot: GeneSlot;
  /** Fixed element pattern. It is never merged or upgraded. */
  factors: GeneFactor[];
  /** Whether each fixed element currently overrides the card's original suit. */
  enabledSlots: boolean[];
  name?: string;
  description?: string;
  sourceMonsterId?: string;
}

export interface EquippedGenes {
  short3?: GeneChain;
  long5A?: GeneChain;
  long5B?: GeneChain;
}

export type TemplateSlot = GeneFactor | null;

export const GENE_SLOT_LENGTHS: Record<GeneSlot, 3 | 5> = { short3: 3, long5A: 5, long5B: 5 };

export function geneSlotForLength(length: number): GeneSlot {
  return length === 3 ? "short3" : "long5A";
}

export function normalizeGeneChain(chain: GeneChain, fallbackSlot?: GeneSlot): GeneChain {
  const targetSlot = chain.targetSlot ?? fallbackSlot ?? geneSlotForLength(chain.factors.length);
  const factors = chain.factors.map((factor) => ({ suit: factor.suit }));
  const enabledSlots = factors.map((_, index) => chain.enabledSlots?.[index] ?? true);
  return { ...chain, targetSlot, factors, enabledSlots };
}

export interface TemplateCard extends Card {
  originalSuit: Suit;
  currentSuit: Suit;
}

function getSlotFactors(chain: GeneChain | undefined, expectedLength: number): TemplateSlot[] {
  if (!chain) return Array.from({ length: expectedLength }, () => null);
  const normalized = normalizeGeneChain(chain);
  if (normalized.factors.length !== expectedLength) throw new Error(`裝備鏈長度必須是 ${expectedLength}`);
  return normalized.factors.map((factor, index) => normalized.enabledSlots[index] ? { suit: factor.suit } : null);
}

export function buildSuitTemplate(equipped: EquippedGenes): TemplateSlot[] {
  return [
    ...getSlotFactors(equipped.short3, 3),
    ...getSlotFactors(equipped.long5A, 5),
    ...getSlotFactors(equipped.long5B, 5),
  ];
}

export function currentSuitOf(card: Card | TemplateCard): Suit {
  return card.currentSuit ?? card.suit;
}

export function applySuitTemplate(cards: Card[], template: TemplateSlot[]): TemplateCard[] {
  if (cards.length !== 13 || template.length !== 13) throw new Error("花色模板與牌組都必須是 13 格");
  return cards.map((card, index) => ({
    ...card,
    originalSuit: card.originalSuit ?? card.suit,
    currentSuit: template[index]?.suit ?? card.currentSuit ?? card.suit,
  }));
}
