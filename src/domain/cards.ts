export const SUITS = ["water", "fire", "wind", "earth"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  water: "💧",
  fire: "🔥",
  wind: "🍃",
  earth: "🪨",
};

export const SUIT_LABELS: Record<Suit, string> = {
  water: "水",
  fire: "火",
  wind: "風",
  earth: "地",
};

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
  return SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: `${suit}-${rank}`,
      rank,
      suit,
    })),
  );
}

function seedHash(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: string): () => number {
  let state = seedHash(seed || "chain-xiii");
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleDeck(deck: Card[], seed: string): Card[] {
  const shuffled = [...deck];
  const random = createSeededRandom(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function drawThirteen(seed: string): Card[] {
  return shuffleDeck(createStandardDeck(), seed).slice(0, 13);
}
