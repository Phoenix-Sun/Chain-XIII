import { describe, expect, it } from "vitest";
import { createStandardDeck, type Card } from "./cards";
import { compareLane, resolveBattle } from "./combat";
import { applySuitTemplate } from "./template";

const deck = createStandardDeck();

describe("three-lane combat", () => {
  it("applies element counter after matching hand category", () => {
    const base = [deck[0], deck[13], deck[27], ...deck.slice(39, 49)];
    const player = applySuitTemplate(base, [
      { suit: "water" }, { suit: "water" }, { suit: "fire" },
      ...Array.from({ length: 10 }, () => null),
    ]).slice(0, 3);
    const enemy = applySuitTemplate(base, [
      { suit: "fire" }, { suit: "fire" }, { suit: "wind" },
      ...Array.from({ length: 10 }, () => null),
    ]).slice(0, 3);
    const result = compareLane("front", player, enemy);
    expect(result.playerRank.category).toBe("pair");
    expect(result.enemyRank.category).toBe("pair");
    expect(result.playerElement).toBe("water");
    expect(result.enemyElement).toBe("fire");
    expect(result.winner).toBe("player");
    expect(result.reason).toBe("element-counter");
  });

  it("counts lane wins and resolves the overall battle", () => {
    const make = (offset: number) => ({
      front: deck.slice(offset, offset + 3),
      middle: deck.slice(offset + 3, offset + 8),
      back: deck.slice(offset + 8, offset + 13),
    });
    const result = resolveBattle(make(0), make(13));
    expect(result.lanes).toHaveLength(3);
    expect(result.playerWins + result.enemyWins).toBeLessThanOrEqual(3);
    expect(["win", "loss", "draw"]).toContain(result.outcome);
  });

  it("keeps a three-lane tie explicit for the Run layer to treat as defeat", () => {
    const make = (prefix: string) => ({
      front: [1, 4, 7].map((rank, index) => ({ id: `${prefix}-front-${index}`, rank: rank as Card["rank"], suit: "water" as const, currentSuit: "water" as const })),
      middle: [1, 1, 4, 7, 9].map((rank, index) => ({ id: `${prefix}-middle-${index}`, rank: rank as Card["rank"], suit: "water" as const, currentSuit: "water" as const })),
      back: [2, 2, 2, 5, 9].map((rank, index) => ({ id: `${prefix}-back-${index}`, rank: rank as Card["rank"], suit: "water" as const, currentSuit: "water" as const })),
    });

    const result = resolveBattle(make("player"), make("enemy"));
    expect(result.playerWins).toBe(0);
    expect(result.enemyWins).toBe(0);
    expect(result.lanes.every((lane) => lane.winner === "tie")).toBe(true);
    expect(result.outcome).toBe("draw");
  });

  it("lets the lava turtle neutralize the first earth counter in the back lane", () => {
    const cards = (suit: Card["suit"]): Card[] => [1, 1, 4, 7, 9].map((rank, index) => ({ id: `${suit}-${index}`, rank: rank as Card["rank"], suit, currentSuit: "wind" }));
    const enemy = cards("fire").map((card) => ({ ...card, currentSuit: "earth" as const }));
    const player = cards("water");
    expect(compareLane("back", player, enemy).winner).toBe("player");
    expect(compareLane("back", player, enemy, { bossRuleId: "boss-neutralize-earth" }).winner).toBe("tie");
    expect(compareLane("back", player, enemy, { bossRuleId: "boss-neutralize-earth", disabledBossRuleIds: ["boss-neutralize-earth"] }).winner).toBe("player");
  });

  it("allows the spark ability to break an otherwise tied front lane", () => {
    const make = (prefix: string): Card[] => [1, 4, 7].map((rank, index) => ({ id: `${prefix}-${index}`, rank: rank as Card["rank"], suit: "water", currentSuit: "water" }));
    expect(compareLane("front", make("player"), make("enemy")).winner).toBe("tie");
    expect(compareLane("front", make("player"), make("enemy"), { frontBonus: 1 }).winner).toBe("player");
  });

  it("lets later chapters win an otherwise tied lane", () => {
    const make = (prefix: string): Card[] => [1, 4, 7].map((rank, index) => ({ id: `${prefix}-${index}`, rank: rank as Card["rank"], suit: "water", currentSuit: "water" }));
    expect(compareLane("front", make("player"), make("enemy")).winner).toBe("tie");
    expect(compareLane("front", make("player"), make("enemy"), { enemyTiebreakerBonus: 1 }).winner).toBe("enemy");
  });

  it("lets Tide Flow retune a formed player lane before comparison", () => {
    const make = (prefix: string, suit: Card["suit"]): Card[] => [1, 4, 7].map((rank, index) => ({ id: `${prefix}-${index}`, rank: rank as Card["rank"], suit, currentSuit: suit }));
    const player = make("player", "fire");
    const enemy = make("enemy", "fire");

    expect(compareLane("front", player, enemy).winner).toBe("tie");
    expect(compareLane("front", player, enemy, { laneElementOverrides: { front: "water" } }).winner).toBe("player");
  });

  it("applies a relic lane bonus without changing element rules", () => {
    const make = (prefix: string): Card[] => [1, 4, 7].map((rank, index) => ({ id: `${prefix}-${index}`, rank: rank as Card["rank"], suit: "water", currentSuit: "water" }));
    expect(compareLane("middle", make("player"), make("enemy")).winner).toBe("tie");
    expect(compareLane("middle", make("player"), make("enemy"), { laneBonuses: { middle: 1 } }).winner).toBe("player");
  });

  it("gives the deep sea boss water advantage in the front lane", () => {
    const cards = (suit: Card["suit"], currentSuit: Card["suit"]): Card[] => [1, 4, 7].map((rank, index) => ({ id: `${suit}-${index}`, rank: rank as Card["rank"], suit, currentSuit }));
    expect(compareLane("front", cards("fire", "fire"), cards("water", "water"), { bossRuleId: "boss-water-advantage" }).winner).toBe("enemy");
    expect(compareLane("front", cards("earth", "earth"), cards("water", "water"), { bossRuleId: "boss-water-advantage", disabledBossRuleIds: ["boss-water-advantage"] }).winner).toBe("player");
  });
});
