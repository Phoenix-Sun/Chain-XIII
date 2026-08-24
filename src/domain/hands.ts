import type { Card } from "./cards";
import { rankValue } from "./cards";

export type HandSize = 3 | 5;
export type HandCategory =
  | "high-card"
  | "pair"
  | "two-pair"
  | "three-of-a-kind"
  | "straight"
  | "flush"
  | "full-house"
  | "four-of-a-kind"
  | "straight-flush";

export interface HandRank {
  category: HandCategory;
  categoryScore: number;
  label: string;
  tiebreaker: number[];
}

const CATEGORY_SCORES: Record<HandCategory, number> = {
  "high-card": 0,
  pair: 1,
  "two-pair": 2,
  "three-of-a-kind": 3,
  straight: 4,
  flush: 5,
  "full-house": 6,
  "four-of-a-kind": 7,
  "straight-flush": 8,
};

const CATEGORY_LABELS: Record<HandCategory, string> = {
  "high-card": "高牌",
  pair: "一對",
  "two-pair": "兩對",
  "three-of-a-kind": "三條",
  straight: "順子",
  flush: "同花",
  "full-house": "葫蘆",
  "four-of-a-kind": "鐵支",
  "straight-flush": "同花順",
};

function sortedValues(cards: Card[]): number[] {
  return cards.map((card) => rankValue(card.rank)).sort((a, b) => b - a);
}

function groups(cards: Card[]): Array<{ value: number; count: number }> {
  const counts = new Map<number, number>();
  for (const card of cards) {
    const value = rankValue(card.rank);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || b.value - a.value);
}

function straightHigh(values: number[]): number | null {
  const unique = [...new Set(values)].sort((a, b) => b - a);
  if (unique.length !== 5) return null;
  if (unique[0] - unique[4] === 4) return unique[0];
  if (unique.join(",") === "14,5,4,3,2") return 5;
  return null;
}

function rank(category: HandCategory, tiebreaker: number[]): HandRank {
  return {
    category,
    categoryScore: CATEGORY_SCORES[category],
    label: CATEGORY_LABELS[category],
    tiebreaker,
  };
}

export function evaluateHand(cards: Card[]): HandRank {
  if (cards.length !== 3 && cards.length !== 5) {
    throw new Error("十三支分墩只能評估 3 張或 5 張牌");
  }

  const values = sortedValues(cards);
  const handGroups = groups(cards);

  if (cards.length === 3) {
    if (handGroups[0].count === 3) return rank("three-of-a-kind", [handGroups[0].value]);
    if (handGroups[0].count === 2) return rank("pair", [handGroups[0].value, handGroups[1].value]);
    return rank("high-card", values);
  }

  const high = straightHigh(values);
  const flush = cards.every((card) => card.suit === cards[0].suit);

  if (high !== null && flush) return rank("straight-flush", [high]);
  if (handGroups[0].count === 4) return rank("four-of-a-kind", [handGroups[0].value, handGroups[1].value]);
  if (handGroups[0].count === 3 && handGroups[1].count === 2) return rank("full-house", [handGroups[0].value, handGroups[1].value]);
  if (flush) return rank("flush", values);
  if (high !== null) return rank("straight", [high]);
  if (handGroups[0].count === 3) return rank("three-of-a-kind", [handGroups[0].value, ...handGroups.slice(1).map((group) => group.value).sort((a, b) => b - a)]);
  if (handGroups[0].count === 2 && handGroups[1].count === 2) {
    return rank("two-pair", [Math.max(handGroups[0].value, handGroups[1].value), Math.min(handGroups[0].value, handGroups[1].value), handGroups[2].value]);
  }
  if (handGroups[0].count === 2) return rank("pair", [handGroups[0].value, ...handGroups.slice(1).map((group) => group.value).sort((a, b) => b - a)]);
  return rank("high-card", values);
}

export function compareHandRanks(left: HandRank, right: HandRank): number {
  if (left.categoryScore !== right.categoryScore) return left.categoryScore - right.categoryScore;
  const length = Math.max(left.tiebreaker.length, right.tiebreaker.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (left.tiebreaker[index] ?? 0) - (right.tiebreaker[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
