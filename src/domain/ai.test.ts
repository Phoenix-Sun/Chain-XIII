import { describe, expect, it } from "vitest";
import { arrangeEnemyHand } from "./ai";
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
});
