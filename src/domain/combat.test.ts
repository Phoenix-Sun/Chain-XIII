import { describe, expect, it } from "vitest";
import { createStandardDeck } from "./cards";
import { compareLane, resolveBattle } from "./combat";
import { applySuitTemplate } from "./template";

const deck = createStandardDeck();

describe("three-lane combat", () => {
  it("applies element counter after matching hand category", () => {
    const base = [deck[0], deck[13], deck[27], ...deck.slice(39, 49)];
    const player = applySuitTemplate(base, [
      { suit: "water", tier: 1 }, { suit: "water", tier: 1 }, { suit: "fire", tier: 1 },
      ...Array.from({ length: 10 }, () => null),
    ]).slice(0, 3);
    const enemy = applySuitTemplate(base, [
      { suit: "fire", tier: 1 }, { suit: "fire", tier: 1 }, { suit: "wind", tier: 1 },
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
});
