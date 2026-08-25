import { SeededRandom } from "./random";

export interface ExplorationResult {
  rolls: number[];
  total: number;
  hasPair: boolean;
  isStraight: boolean;
  success: boolean;
}

export type ExplorationObjective = "sum" | "pair" | "straight";

export function objectiveForEvent(eventId: string): ExplorationObjective {
  const eventNumber = Number(eventId.replace("event-", "")) || 1;
  if (eventNumber % 3 === 0) return "straight";
  return eventNumber % 2 === 0 ? "pair" : "sum";
}

export function objectiveLabel(objective: ExplorationObjective): string {
  return objective === "straight" ? "擲出一組連續點數" : objective === "pair" ? "配置一組相同點數" : "總和達到 9";
}

export function rollExploration(seed: string, eventId: string, attempt = 0): ExplorationResult {
  const random = new SeededRandom(`exploration:${seed}:${eventId}:${attempt}`);
  const rolls = Array.from({ length: 3 }, () => random.int(6) + 1);
  const total = rolls.reduce((sum, roll) => sum + roll, 0);
  const hasPair = new Set(rolls).size < rolls.length;
  const sorted = [...rolls].sort((left, right) => left - right);
  const isStraight = sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1;
  const objective = objectiveForEvent(eventId);
  const success = objective === "straight" ? isStraight : objective === "pair" ? hasPair : total >= 9;
  return { rolls, total, hasPair, isStraight, success };
}
