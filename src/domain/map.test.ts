import { describe, expect, it } from "vitest";
import { enemyTiebreakerBonusForChapter, generateRunMap, nodeTypesForChapter } from "./map";
import { catalog } from "../content/catalog";

describe("seeded run map", () => {
  it("raises enemy tie-break strength by chapter", () => {
    expect(enemyTiebreakerBonusForChapter(1)).toBe(0);
    expect(enemyTiebreakerBonusForChapter(2)).toBe(0);
    expect(enemyTiebreakerBonusForChapter(3)).toBe(1);
  });

  it("keeps Elite nodes out of general route pools", () => {
    expect(nodeTypesForChapter(1)).not.toContain("elite");
    expect(nodeTypesForChapter(2)).not.toContain("elite");
    expect(nodeTypesForChapter(3)).not.toContain("elite");
  });

  it("reproduces nodes and edges from the same seed", () => {
    expect(generateRunMap("map-seed")).toEqual(generateRunMap("map-seed"));
  });

  it("creates a forward-only route ending in a boss", () => {
    const map = generateRunMap("route-seed");
    expect(map.nodes[0].row).toBe(0);
    expect(map.chapterLengths).toHaveLength(3);
    expect(map.chapterLengths[0]).toBeGreaterThanOrEqual(10);
    expect(map.chapterLengths[0]).toBeLessThanOrEqual(13);
    expect(map.chapterLengths[1]).toBeGreaterThanOrEqual(7);
    expect(map.chapterLengths[1]).toBeLessThanOrEqual(9);
    expect(map.chapterLengths[2]).toBeGreaterThanOrEqual(4);
    expect(map.chapterLengths[2]).toBeLessThanOrEqual(6);
    expect(new Set(map.nodes.map((node) => node.chapter)).size).toBe(3);
    expect(map.nodes.at(-1)?.type).toBe("boss");
    expect(map.chapterEndNodeIds).toHaveLength(3);
    expect(map.chapterEndNodeIds.every((endId, index) => {
      const end = map.nodes.find((node) => node.id === endId)!;
      return end.type === (index === 2 ? "boss" : "elite") && end.chapter === index + 1;
    })).toBe(true);
    expect(map.nodes.every((node) => node.nextNodeIds.every((nextId) => {
      const next = map.nodes.find((candidate) => candidate.id === nextId)!;
      return next.row === node.row + 1;
    }))).toBe(true);
  });

  it("keeps every sampled seed connected through three catalog-backed chapter Bosses", () => {
    for (const seed of ["seed-a", "seed-b", "seed-c", "seed-d", "seed-e"]) {
      const map = generateRunMap(seed);
      const monsterIds = new Set(catalog.monsters.map((monster) => monster.id));
      expect(map.nodes.filter((node) => node.monsterId).every((node) => monsterIds.has(node.monsterId!))).toBe(true);
      let current = map.startNodeId;
      for (let step = 0; step < map.nodes.length && current !== map.bossNodeId; step += 1) current = map.nodes.find((node) => node.id === current)!.nextNodeIds[0];
      expect(current).toBe(map.bossNodeId);
      expect(map.chapterEndNodeIds.every((endId, index) => map.nodes.some((node) => node.id === endId && node.type === (index === 2 ? "boss" : "elite")))).toBe(true);
    }
  });
});
