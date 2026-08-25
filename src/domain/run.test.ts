import { describe, expect, it } from "vitest";
import { canMoveToNode, claimCurrentNodeReward, completeCurrentNode, createRunState, moveToNode, validatePartyCharacterIds, type RunState } from "./run";
import { rewardForNode } from "./runRewards";

describe("run state", () => {
  it("creates a reproducible active run with a flexible party", () => {
    const run = createRunState("run-seed", ["water-scout"]);
    expect(run.status).toBe("active");
    expect(run.partyCharacterIds).toEqual(["water-scout"]);
    expect(run.map).toEqual(createRunState("run-seed", ["water-scout", "fire-smith"]).map);
  });

  it("starts the next Run with the account gene inventory", () => {
    const chain = { id: "permanent-chain", factors: [{ suit: "water" as const, tier: 1 as const }, { suit: "fire" as const, tier: 1 as const }, { suit: "wind" as const, tier: 1 as const }] };
    expect(createRunState("inventory-seed", ["water-scout"], [chain]).geneInventory).toEqual([chain]);
  });

  it("accepts one to three owned characters", () => {
    expect(validatePartyCharacterIds(["water-scout"])).toEqual([]);
    expect(validatePartyCharacterIds(["water-scout", "fire-smith", "wind-oracle"])).toEqual([]);
    expect(() => createRunState("run-seed", [])).toThrow("至少需要 1 名角色");
    expect(() => createRunState("run-seed", ["a", "b", "c", "d"])).toThrow("最多選 3 名");
    expect(() => createRunState("run-seed", ["a", "a"])).toThrow("不能重複");
  });

  it("only permits moving to a connected next node", () => {
    const run = createRunState("move-seed", ["a", "b", "c"]);
    const nextId = run.map.nodes[0].nextNodeIds[0];
    expect(nextId).toBeDefined();
    expect(canMoveToNode(run, nextId)).toBe(true);
    expect(moveToNode(run, nextId).currentNodeId).toBe(nextId);
    expect(() => moveToNode(run, run.map.bossNodeId)).toThrow("只能前進");
  });

  it("completes a node, claims its reward once, and unlocks the next route", () => {
    const run = createRunState("reward-seed", ["water-scout"]);
    const nextId = run.map.nodes[0].nextNodeIds[0];
    const arrived = moveToNode(run, nextId);
    const node = arrived.map.nodes.find((candidate) => candidate.id === nextId)!;
    const completed = completeCurrentNode(arrived);
    const reward = rewardForNode(node);
    const claimed = claimCurrentNodeReward(completed, { ...reward, geneChain: { id: "test-chain", factors: [{ suit: "water", tier: 1 }, { suit: "fire", tier: 1 }, { suit: "wind", tier: 1 }] } });

    expect(claimed.completedNodeIds).toContain(nextId);
    expect(claimed.claimedRewardNodeIds).toEqual([nextId]);
    expect(claimed.earnedCrystals).toBe(reward.crystals);
    expect(claimed.geneInventory).toHaveLength(1);
    expect(() => claimCurrentNodeReward(claimed, reward)).toThrow("已領取");
    expect(canMoveToNode(claimed, node.nextNodeIds[0])).toBe(true);
  });

  it("allows crystal-only claiming when the gene inventory is full", () => {
    const run = createRunState("capacity-seed", ["water-scout"]);
    const nextId = run.map.nodes[0].nextNodeIds[0];
    const arrived = moveToNode(run, nextId);
    const completed = completeCurrentNode(arrived);
    const fullInventory: RunState["geneInventory"] = Array.from({ length: completed.geneCapacity }, (_, index) => ({ id: `chain-${index}`, factors: [{ suit: "water" as const, tier: 1 as const }, { suit: "fire" as const, tier: 1 as const }, { suit: "wind" as const, tier: 1 as const }] }));
    const fullRun = { ...completed, geneInventory: fullInventory };
    const node = fullRun.map.nodes.find((candidate) => candidate.id === nextId)!;
    const reward = rewardForNode(node);
    const geneChain: RunState["geneInventory"][number] = { id: "new-chain", factors: [{ suit: "earth", tier: 1 }, { suit: "water", tier: 1 }, { suit: "fire", tier: 1 }] };
    expect(() => claimCurrentNodeReward(fullRun, { ...reward, geneChain })).toThrow("基因庫已滿");
    const claimed = claimCurrentNodeReward(fullRun, { ...reward, geneChain }, { takeGene: false });
    expect(claimed.earnedCrystals).toBe(reward.crystals);
    expect(claimed.geneInventory).toHaveLength(fullRun.geneCapacity);
  });

  it("stores relic rewards in the active Run", () => {
    const run = createRunState("relic-seed", ["water-scout"]);
    const nextId = run.map.nodes[0].nextNodeIds[0];
    const arrived = moveToNode(run, nextId);
    const completed = completeCurrentNode(arrived);
    const claimed = claimCurrentNodeReward(completed, { crystals: 18, relicId: "relic-1", title: "遺物", detail: "找到遺物" });
    expect(claimed.relicIds).toEqual(["relic-1"]);
  });

  it("marks the boss node as a won run", () => {
    const run = createRunState("boss-seed", ["water-scout"]);
    const bossRun = { ...run, currentNodeId: run.finalBossId };
    expect(completeCurrentNode(bossRun).status).toBe("won");
  });

  it("can complete a full deterministic route from start to boss", () => {
    let run = createRunState("full-run-seed", ["water-scout", "fire-smith"]);
    let steps = 0;
    while (run.currentNodeId !== run.finalBossId && steps < run.map.nodes.length) {
      const nextId = run.map.nodes.find((node) => node.id === run.currentNodeId)!.nextNodeIds[0];
      run = moveToNode(run, nextId);
      const node = run.map.nodes.find((candidate) => candidate.id === nextId)!;
      run = completeCurrentNode(run);
      run = claimCurrentNodeReward(run, rewardForNode(node));
      steps += 1;
    }
    expect(run.status).toBe("won");
    expect(run.currentNodeId).toBe(run.finalBossId);
    expect(run.earnedCrystals).toBeGreaterThan(0);
    expect(run.completedNodeIds).toContain(run.finalBossId);
  });
});
