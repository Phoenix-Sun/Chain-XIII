import type { Card } from "./cards";
import { evaluateHand } from "./hands";
import { validateLayout, type Lanes } from "./layout";

function combinations<T>(items: T[], choose: number): T[][] {
  const result: T[][] = [];
  function visit(start: number, picked: T[]): void {
    if (picked.length === choose) { result.push([...picked]); return; }
    for (let index = start; index <= items.length - (choose - picked.length); index += 1) visit(index + 1, [...picked, items[index]]);
  }
  visit(0, []);
  return result;
}

function layoutScore(lanes: Lanes): number[] {
  return [lanes.back, lanes.middle, lanes.front].flatMap((lane) => {
    const rank = evaluateHand(lane);
    return [rank.categoryScore, ...rank.tiebreaker, 0, 0, 0, 0, 0].slice(0, 6);
  });
}

function compareScores(left: number[], right: number[]): number {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export interface EnemyHandChoice {
  cards: Card[];
  lanes: Lanes;
  candidateIndex: number;
  score: number[];
}

export function arrangeEnemyHandWithScore(cards: Card[]): { lanes: Lanes; score: number[] } {
  if (cards.length !== 13) throw new Error("敵方 AI 必須收到 13 張牌");
  let best: Lanes | null = null;
  let bestScore: number[] | null = null;
  for (const front of combinations(cards, 3)) {
    const remainingAfterFront = cards.filter((card) => !front.some((candidate) => candidate.id === card.id));
    for (const middle of combinations(remainingAfterFront, 5)) {
      const back = remainingAfterFront.filter((card) => !middle.some((candidate) => candidate.id === card.id));
      const lanes: Lanes = { front, middle, back };
      if (!validateLayout(lanes).valid) continue;
      const score = layoutScore(lanes);
      if (!bestScore || compareScores(score, bestScore) > 0) { best = lanes; bestScore = score; }
    }
  }
  if (!best || !bestScore) throw new Error("AI 找不到合法的十三支分牌");
  return { lanes: best, score: bestScore };
}

export function arrangeEnemyHand(cards: Card[]): Lanes {
  return arrangeEnemyHandWithScore(cards).lanes;
}

export function chooseBestEnemyHand(candidateHands: Card[][]): EnemyHandChoice {
  if (candidateHands.length === 0) throw new Error("敵方至少需要一組候選牌");
  let best: EnemyHandChoice | null = null;
  candidateHands.forEach((cards, candidateIndex) => {
    const arranged = arrangeEnemyHandWithScore(cards);
    const choice = { cards, lanes: arranged.lanes, candidateIndex, score: arranged.score };
    if (!best || compareScores(choice.score, best.score) > 0) best = choice;
  });
  if (!best) throw new Error("AI 找不到合法的候選牌組");
  return best;
}
