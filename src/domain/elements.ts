import type { Card } from "./cards";
import { currentSuitOf, type TemplateCard } from "./template";
import type { Suit } from "./cards";

export const ELEMENT_BEATS: Record<Suit, Suit> = {
  water: "fire",
  fire: "wind",
  wind: "earth",
  earth: "water",
};

export function beats(attacker: Suit | null, defender: Suit | null): boolean {
  return attacker !== null && defender !== null && ELEMENT_BEATS[attacker] === defender;
}

export function resolveLaneElement(cards: Array<Card | TemplateCard>): Suit | null {
  if (cards.length !== 3 && cards.length !== 5) throw new Error("元素判定只能使用 3 張或 5 張牌");
  const threshold = cards.length === 3 ? 2 : 3;
  const counts = new Map<Suit, number>();
  for (const card of cards) {
    const suit = currentSuitOf(card);
    counts.set(suit, (counts.get(suit) ?? 0) + 1);
  }
  for (const suit of ["water", "fire", "wind", "earth"] as Suit[]) {
    if ((counts.get(suit) ?? 0) >= threshold) return suit;
  }
  return null;
}
