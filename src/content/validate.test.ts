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

  it("rejects dangling drop and event reward references", () => {
    const invalid = { ...catalog, monsters: catalog.monsters.map((monster, index) => index === 0 ? { ...monster, dropChainPoolIds: ["missing-chain"] } : monster), events: catalog.events.map((event, index) => index === 0 ? { ...event, rewardIds: ["missing-reward"] } : event) };
    expect(validateContentCatalog(invalid)).toEqual(expect.arrayContaining(["monster-normal-1 掉落池含不存在的基因鏈", "event-1 含不存在的獎勵 ID"]));
  });
});
