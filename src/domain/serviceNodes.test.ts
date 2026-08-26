import { describe, expect, it } from "vitest";
import { createRunState } from "./run";
import { resolveServiceNode } from "./serviceNodes";

describe("route support nodes", () => {
  it("lets a caravan trade crystals for healing, preparation, or information", () => {
    const base = createRunState("service-seed", ["water-scout"]);
    const node = { ...base.map.nodes[1], type: "caravan" as const };
    expect(resolveServiceNode({ ...base, currentNodeId: node.id, earnedCrystals: 10, livesRemaining: 1 }, node, "caravan-heal")).toMatchObject({ earnedCrystals: 0, livesRemaining: 2 });
    expect(resolveServiceNode({ ...base, currentNodeId: node.id, earnedCrystals: 8 }, node, "caravan-focus").discoveredRunFlags).toContain("next-battle:focus");
    expect(resolveServiceNode({ ...base, currentNodeId: node.id, earnedCrystals: 6 }, node, "caravan-scout").discoveredRunFlags).toContain(`route:next-layer-revealed:${node.id}`);
  });

  it("makes campfire healing free and marks a lookout as completed", () => {
    const base = createRunState("service-seed-2", ["water-scout"]);
    const campfire = { ...base.map.nodes[1], type: "campfire" as const };
    const lookout = { ...base.map.nodes[2], type: "lookout" as const };
    expect(resolveServiceNode({ ...base, currentNodeId: campfire.id, livesRemaining: 1 }, campfire, "campfire-rest")).toMatchObject({ livesRemaining: 2, earnedCrystals: 0 });
    expect(resolveServiceNode({ ...base, currentNodeId: lookout.id }, lookout, "lookout-reveal").claimedRewardNodeIds).toContain(lookout.id);
  });
});
