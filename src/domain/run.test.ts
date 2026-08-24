import { describe, expect, it } from "vitest";
import { canMoveToNode, createRunState, moveToNode } from "./run";

describe("run state", () => {
  it("creates a reproducible active run with a fixed party", () => {
    const run = createRunState("run-seed", ["water-scout", "fire-smith", "wind-oracle"]);
    expect(run.status).toBe("active");
    expect(run.partyCharacterIds).toHaveLength(3);
    expect(run.map).toEqual(createRunState("run-seed", ["water-scout", "fire-smith", "wind-oracle"]).map);
  });

  it("only permits moving to a connected next node", () => {
    const run = createRunState("move-seed", ["a", "b", "c"]);
    const nextId = run.map.nodes[0].nextNodeIds[0];
    expect(nextId).toBeDefined();
    expect(canMoveToNode(run, nextId)).toBe(true);
    expect(moveToNode(run, nextId).currentNodeId).toBe(nextId);
    expect(() => moveToNode(run, run.map.bossNodeId)).toThrow("只能前進");
  });
});
