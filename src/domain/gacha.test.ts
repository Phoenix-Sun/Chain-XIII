import { describe, expect, it } from "vitest";
import { CHARACTER_DRAW_COST, drawCharacter } from "./gacha";
import { createEmptyMeta } from "./save";

describe("character gacha", () => {
  it("spends crystals and adds a new owned character", () => {
    const meta = { ...createEmptyMeta(), crystals: CHARACTER_DRAW_COST };
    const result = drawCharacter(meta, ["fire-smith"], "gacha-seed");
    expect(result.characterId).toBe("fire-smith");
    expect(result.duplicate).toBe(false);
    expect(result.meta.crystals).toBe(0);
    expect(result.meta.characters.some((character) => character.characterId === "fire-smith")).toBe(true);
  });

  it("turns a duplicate draw into an imprint", () => {
    const meta = { ...createEmptyMeta(), crystals: CHARACTER_DRAW_COST };
    const result = drawCharacter(meta, ["water-scout"], "duplicate-seed");
    expect(result.duplicate).toBe(true);
    expect(result.meta.characters[0].imprintCount).toBe(1);
  });

  it("rejects a draw without enough crystals", () => {
    expect(() => drawCharacter(createEmptyMeta(), ["fire-smith"], "poor-seed")).toThrow("需要 100 水晶");
  });
});
