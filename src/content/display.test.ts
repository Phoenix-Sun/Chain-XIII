import { describe, expect, it } from "vitest";
import { catalog } from "./catalog";
import { monsterDisplayName } from "./display";

describe("content display labels", () => {
  it("turns internal monster ids into player-facing labels", () => {
    expect(monsterDisplayName(catalog.monsters.find((monster) => monster.id === "monster-normal-6")!)).toBe("普通怪物 6");
    expect(monsterDisplayName(catalog.monsters.find((monster) => monster.id === "monster-elite-3")!)).toBe("強敵 3");
    expect(monsterDisplayName(catalog.monsters.find((monster) => monster.id === "boss-deep-sea")!)).toBe("Boss・deep sea");
  });
});
