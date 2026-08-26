import { describe, expect, it } from "vitest";
import { catalog } from "./catalog";
import { validateContentCatalog } from "./validate";

describe("content catalog", () => {
  it("ships the MVP content shape", () => {
    expect(catalog.characters).toHaveLength(9);
    expect(catalog.monsters.filter((monster) => monster.kind === "normal")).toHaveLength(12);
    expect(catalog.monsters.filter((monster) => monster.kind === "elite")).toHaveLength(4);
    expect(catalog.monsters.filter((monster) => monster.kind === "boss")).toHaveLength(3);
    expect(catalog.relics).toHaveLength(19);
    expect(catalog.events).toHaveLength(12);
    expect(new Set(catalog.events.map((event) => event.name)).size).toBe(catalog.events.length);
    expect(catalog.events.every((event) => event.content && event.successText && event.failureText)).toBe(true);
    expect(catalog.relics.every((relic) => relic.trigger && relic.effect && relic.detail)).toBe(true);
    expect(catalog.blessings).toHaveLength(3);
    expect(catalog.geneChains.filter((chain) => chain.targetSlot === "short3")).toHaveLength(3);
    expect(catalog.geneChains.some((chain) => chain.targetSlot === "long5A")).toBe(true);
    expect(catalog.geneChains.some((chain) => chain.targetSlot === "long5B")).toBe(true);
    expect(catalog.geneChains.every((chain) => chain.factors.every((factor) => !Object.hasOwn(factor, "tier")))).toBe(true);
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

  it("rejects relics without player-facing effect copy", () => {
    const invalid = { ...catalog, relics: catalog.relics.map((relic, index) => index === 0 ? { ...relic, trigger: "", effect: "", detail: "" } : relic) };
    expect(validateContentCatalog(invalid)).toEqual(expect.arrayContaining(["relic-1 缺少觸發時機", "relic-1 缺少效果說明", "relic-1 缺少白話說明"]));
  });

  it("requires at least half of relics to affect thirteen-card combat", () => {
    const invalid = { ...catalog, relics: catalog.relics.map((relic) => ({ ...relic, category: "route" as const })) };
    expect(validateContentCatalog(invalid)).toContain("遺物池至少一半必須影響十三支戰鬥");
  });
});
