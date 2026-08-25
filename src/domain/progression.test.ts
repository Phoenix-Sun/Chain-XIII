import { describe, expect, it } from "vitest";
import { createEmptyMeta } from "./save";
import { characterUpgradeCost, upgradeCharacter } from "./progression";

describe("character progression", () => {
  it("upgrades an owned character by spending crystals", () => {
    const meta = { ...createEmptyMeta(), crystals: characterUpgradeCost(1) };
    const upgraded = upgradeCharacter(meta, "water-scout");
    expect(upgraded.crystals).toBe(0);
    expect(upgraded.characters[0].star).toBe(2);
  });

  it("rejects insufficient funds and maxed characters", () => {
    expect(() => upgradeCharacter(createEmptyMeta(), "water-scout")).toThrow("需要");
    const maxed = { ...createEmptyMeta(), characters: [{ characterId: "water-scout", star: 5 as const, imprintCount: 0 }] };
    expect(() => upgradeCharacter(maxed, "water-scout")).toThrow("最高星級");
  });
});
