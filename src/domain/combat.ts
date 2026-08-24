import { compareHandRanks, evaluateHand, type HandRank } from "./hands";
import type { Card } from "./cards";
import { beats, resolveLaneElement } from "./elements";
import type { TemplateCard } from "./template";

export type CombatCard = Card | TemplateCard;
export type CombatLane = "front" | "middle" | "back";
export type LaneWinner = "player" | "enemy" | "tie";

export interface BattleLayout {
  front: CombatCard[];
  middle: CombatCard[];
  back: CombatCard[];
}

export interface LaneResult {
  lane: CombatLane;
  winner: LaneWinner;
  playerRank: HandRank;
  enemyRank: HandRank;
  playerElement: ReturnType<typeof resolveLaneElement>;
  enemyElement: ReturnType<typeof resolveLaneElement>;
  reason: "hand-category" | "element-counter" | "tiebreaker";
}

export interface BattleResult {
  lanes: LaneResult[];
  playerWins: number;
  enemyWins: number;
  outcome: "win" | "loss" | "draw";
}

export function compareLane(lane: CombatLane, player: CombatCard[], enemy: CombatCard[]): LaneResult {
  const playerRank = evaluateHand(player);
  const enemyRank = evaluateHand(enemy);
  const playerElement = resolveLaneElement(player);
  const enemyElement = resolveLaneElement(enemy);
  const categoryDifference = playerRank.categoryScore - enemyRank.categoryScore;
  if (categoryDifference !== 0) {
    return { lane, winner: categoryDifference > 0 ? "player" : "enemy", playerRank, enemyRank, playerElement, enemyElement, reason: "hand-category" };
  }
  if (beats(playerElement, enemyElement)) {
    return { lane, winner: "player", playerRank, enemyRank, playerElement, enemyElement, reason: "element-counter" };
  }
  if (beats(enemyElement, playerElement)) {
    return { lane, winner: "enemy", playerRank, enemyRank, playerElement, enemyElement, reason: "element-counter" };
  }
  const difference = compareHandRanks(playerRank, enemyRank);
  return { lane, winner: difference > 0 ? "player" : difference < 0 ? "enemy" : "tie", playerRank, enemyRank, playerElement, enemyElement, reason: "tiebreaker" };
}

export function resolveBattle(player: BattleLayout, enemy: BattleLayout): BattleResult {
  const lanes = (["front", "middle", "back"] as CombatLane[]).map((lane) => compareLane(lane, player[lane], enemy[lane]));
  const playerWins = lanes.filter((result) => result.winner === "player").length;
  const enemyWins = lanes.filter((result) => result.winner === "enemy").length;
  return { lanes, playerWins, enemyWins, outcome: playerWins > enemyWins ? "win" : enemyWins > playerWins ? "loss" : "draw" };
}
