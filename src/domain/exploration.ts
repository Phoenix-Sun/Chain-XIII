import { SeededRandom } from "./random";

export type ExplorationObjective = { kind: "sum-at-least"; value: number } | { kind: "pair" } | { kind: "straight" };
export interface ExplorationRoll { values: number[]; total: number; success: boolean; }

export function rollExploration(seed: string, objective: ExplorationObjective, diceCount = 3): ExplorationRoll {
  if (!Number.isInteger(diceCount) || diceCount <= 0) throw new Error("骰子數量必須是正整數");
  const random = new SeededRandom(seed);
  const values = Array.from({ length: diceCount }, () => random.int(6) + 1);
  const total = values.reduce((sum, value) => sum + value, 0);
  const success = objective.kind === "sum-at-least" ? total >= objective.value : objective.kind === "pair" ? new Set(values).size < values.length : values.some((value, index) => values.includes(value + 1) && index < values.length - 1);
  return { values, total, success };
}
