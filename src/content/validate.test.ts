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
    expect(new Set(catalog.events.map((event) => event.name)).size).toBe(catalog.events.length);
    expect(catalog.events.every((event) => event.content && event.successText && event.failureText)).toBe(true);
    expect(validateContentCatalog(catalog)).toEqual([]);
  });

  it("rejects dangling drop and event reward references", () => {
    const invalid = { ...catalog, monsters: catalog.monsters.map((monster, index) => index === 0 ? { ...monster, dropChainPoolIds: ["missing-chain"] } : monster), events: catalog.events.map((event, index) => index === 0 ? { ...event, rewardIds: ["missing-reward"] } : event) };
    expect(validateContentCatalog(invalid)).toEqual(expect.arrayContaining(["monster-normal-1 掉落池含不存在的基因鏈", "event-1 含不存在的獎勵 ID"]));
  });

  it("rejects events without authored player-facing text", () => {
    const invalid = { ...catalog, events: catalog.events.map((event, index) => index === 0 ? { ...event, name: "", content: "", successText: "", failureText: "" } : event) };
    expect(validateContentCatalog(invalid)).toEqual(expect.arrayContaining(["event-1 缺少事件名稱", "event-1 缺少事件內容", "event-1 缺少成功結果文字", "event-1 缺少失敗結果文字"]));
  });
});
