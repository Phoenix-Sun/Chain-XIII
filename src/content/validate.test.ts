import { describe, expect, it } from "vitest";
import { catalog } from "./catalog";
import { validateContentCatalog } from "./validate";

describe("content catalog", () => {
  it("ships the MVP content shape", () => {
    expect(catalog.characters).toHaveLength(9);
    expect(catalog.monsters.filter((monster) => monster.kind === "normal")).toHaveLength(12);
    expect(catalog.monsters.filter((monster) => monster.kind === "elite")).toHaveLength(4);
    expect(catalog.monsters.filter((monster) => monster.kind === "boss")).toHaveLength(3);
    expect(catalog.relics).toHaveLength(15);
    expect(catalog.events).toHaveLength(12);
    expect(validateContentCatalog(catalog)).toEqual([]);
  });
});
