import { describe, expect, it } from "vitest";
import { arrangeEnemyHand, arrangeEnemyHandWithScore, chooseBestEnemyHand } from "./ai";
import { drawThirteen } from "./cards";
import { validateLayout } from "./layout";

describe("enemy AI", () => {
  it("finds a legal 3/5/5 layout from a seeded hand", () => {
    const hand = drawThirteen("ai-seed");
    const layout = arrangeEnemyHand(hand);
    expect(validateLayout(layout).valid).toBe(true);
    expect(new Set([...layout.front, ...layout.middle, ...layout.back].map((card) => card.id)).size).toBe(13);
  });

  it("rejects hands that do not contain 13 cards", () => {
    expect(() => arrangeEnemyHand(drawThirteen("ai-seed").slice(0, 12))).toThrow("13 張");
  });

  it("chooses the highest-scoring layout from deterministic candidate hands", () => {
    const candidates = [drawThirteen("candidate-a"), drawThirteen("candidate-b"), drawThirteen("candidate-c")];
    const choice = chooseBestEnemyHand(candidates);
    const scores = candidates.map((candidate) => arrangeEnemyHandWithScore(candidate).score);
    const compare = (left: number[], right: number[]) => {
      for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) return left[index] - right[index];
      }
      return 0;
    };
    expect(scores.every((score) => compare(choice.score, score) >= 0)).toBe(true);
    expect(choice.cards).toBe(candidates[choice.candidateIndex]);
  });
});
