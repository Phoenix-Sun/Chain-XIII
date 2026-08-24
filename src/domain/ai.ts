import type { Card } from "./cards";
import { compareHandRanks, evaluateHand } from "./hands";
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

function layoutScore(lanes: Lanes): number {
  return evaluateHand(lanes.back).categoryScore * 100 + evaluateHand(lanes.middle).categoryScore * 10 + evaluateHand(lanes.front).categoryScore;
}

export function arrangeEnemyHand(cards: Card[]): Lanes {
  if (cards.length !== 13) throw new Error("敵方 AI 必須收到 13 張牌");
  let best: Lanes | null = null;
  let bestScore = -1;
  for (const front of combinations(cards, 3)) {
    const remainingAfterFront = cards.filter((card) => !front.some((candidate) => candidate.id === card.id));
    for (const middle of combinations(remainingAfterFront, 5)) {
      const back = remainingAfterFront.filter((card) => !middle.some((candidate) => candidate.id === card.id));
      const lanes: Lanes = { front, middle, back };
      if (!validateLayout(lanes).valid) continue;
      const score = layoutScore(lanes);
      if (score > bestScore) { best = lanes; bestScore = score; }
    }
  }
  if (!best) throw new Error("AI 找不到合法的十三支分牌");
  return best;
}
