import { SeededRandom } from "./random";

export const SUITS = ["water", "fire", "wind", "earth"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
  /** 原始牌面與目前顯示花色；未套模板時兩者相同。 */
  originalSuit?: Suit;
  currentSuit?: Suit;
}

export type CardSortMode = "rank" | "suit-rank";

export const SUIT_SYMBOLS: Record<Suit, string> = { water: "💧", fire: "🔥", wind: "🍃", earth: "🪨" };
export const SUIT_LABELS: Record<Suit, string> = { water: "水", fire: "火", wind: "風", earth: "地" };

export function rankLabel(rank: Rank): string {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

export function rankValue(rank: Rank): number {
  return rank === 1 ? 14 : rank;
}

export function createStandardDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ id: `${suit}-${rank}`, rank, suit, originalSuit: suit, currentSuit: suit })));
}

export function shuffleDeck(deck: Card[], seed: string): Card[] {
  const shuffled = [...deck];
  const random = new SeededRandom(seed || "chain-xiii");
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = random.int(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function drawThirteen(seed: string): Card[] {
  return shuffleDeck(createStandardDeck(), seed).slice(0, 13);
}

export function sortCards(cards: Card[], mode: CardSortMode): Card[] {
  const suitOrder = new Map(SUITS.map((suit, index) => [suit, index]));
  return cards
    .map((card, index) => ({ card, index }))
    .sort((left, right) => {
      const rankDifference = left.card.rank - right.card.rank;
      const leftSuit = left.card.currentSuit ?? left.card.suit;
      const rightSuit = right.card.currentSuit ?? right.card.suit;
      const suitDifference = (suitOrder.get(leftSuit) ?? 0) - (suitOrder.get(rightSuit) ?? 0);
      const primaryDifference = mode === "rank" ? rankDifference : suitDifference;
      const secondaryDifference = mode === "rank" ? suitDifference : rankDifference;
      return primaryDifference || secondaryDifference || left.index - right.index;
    })
    .map(({ card }) => card);
}
