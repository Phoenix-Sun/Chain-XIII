import { describe, expect, it } from "vitest";
import { generateRunMap } from "./map";

describe("seeded run map", () => {
  it("reproduces nodes and edges from the same seed", () => {
    expect(generateRunMap("map-seed")).toEqual(generateRunMap("map-seed"));
  });

  it("creates a forward-only route ending in a boss", () => {
    const map = generateRunMap("route-seed");
    expect(map.nodes[0].row).toBe(0);
    expect(map.nodes.at(-1)?.type).toBe("boss");
    expect(map.nodes.every((node) => node.nextNodeIds.every((nextId) => {
      const next = map.nodes.find((candidate) => candidate.id === nextId)!;
      return next.row === node.row + 1;
    }))).toBe(true);
  });
});
