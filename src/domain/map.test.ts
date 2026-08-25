import { describe, expect, it } from "vitest";
import { generateRunMap } from "./map";
import { catalog } from "../content/catalog";

describe("seeded run map", () => {
  it("reproduces nodes and edges from the same seed", () => {
    expect(generateRunMap("map-seed")).toEqual(generateRunMap("map-seed"));
  });

  it("creates a forward-only route ending in a boss", () => {
    const map = generateRunMap("route-seed");
    expect(map.nodes[0].row).toBe(0);
    expect(new Set(map.nodes.map((node) => node.row)).size).toBe(16);
    expect(map.nodes.at(-1)?.type).toBe("boss");
    expect(map.nodes.every((node) => node.nextNodeIds.every((nextId) => {
      const next = map.nodes.find((candidate) => candidate.id === nextId)!;
      return next.row === node.row + 1;
    }))).toBe(true);
  });

  it("keeps every sampled seed connected to a catalog-backed Boss", () => {
    for (const seed of ["seed-a", "seed-b", "seed-c", "seed-d", "seed-e"]) {
      const map = generateRunMap(seed);
      const monsterIds = new Set(catalog.monsters.map((monster) => monster.id));
      expect(map.nodes.filter((node) => node.monsterId).every((node) => monsterIds.has(node.monsterId!))).toBe(true);
      let current = map.startNodeId;
      for (let step = 0; step < map.nodes.length && current !== map.bossNodeId; step += 1) current = map.nodes.find((node) => node.id === current)!.nextNodeIds[0];
      expect(current).toBe(map.bossNodeId);
    }
  });
});
