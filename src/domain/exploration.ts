import { SeededRandom } from "./random";

export interface ExplorationResult {
  rolls: number[];
  total: number;
  hasPair: boolean;
  success: boolean;
}

export function rollExploration(seed: string, eventId: string, attempt = 0): ExplorationResult {
  const random = new SeededRandom(`exploration:${seed}:${eventId}:${attempt}`);
  const rolls = Array.from({ length: 3 }, () => random.int(6) + 1);
  const total = rolls.reduce((sum, roll) => sum + roll, 0);
  const hasPair = new Set(rolls).size < rolls.length;
  const eventNumber = Number(eventId.replace("event-", "")) || 1;
  const success = eventNumber % 2 === 0 ? hasPair : total >= 9;
  return { rolls, total, hasPair, success };
}
