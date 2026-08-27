import { describe, expect, it } from "vitest";
import { abandonRun, applyRelicAltarSettlement, canMoveToNode, claimCurrentNodeReward, completeCurrentNode, createRunState, failCurrentNode, moveToNode, resolveBattleAftermath, validatePartyCharacterIds, type RunState } from "./run";
import { rewardForNode } from "./runRewards";

describe("run state", () => {
  it("creates a reproducible active run with a flexible party", () => {
    const run = createRunState("run-seed", ["water-scout"]);
    expect(run.status).toBe("active");
    expect(run.partyCharacterIds).toEqual(["water-scout"]);
    expect(run.map).toEqual(createRunState("run-seed", ["water-scout", "fire-smith"]).map);
  });

  it("starts the next Run with the account gene inventory", () => {
    const chain = { id: "permanent-chain", targetSlot: "short3" as const, factors: [{ suit: "water" as const }, { suit: "fire" as const }, { suit: "wind" as const }], enabledSlots: [true, true, true] };
    expect(createRunState("inventory-seed", ["water-scout"], [chain]).geneInventory).toEqual([chain]);
  });

  it("accepts one to three owned characters", () => {
    expect(validatePartyCharacterIds(["water-scout"])).toEqual([]);
    expect(validatePartyCharacterIds(["water-scout", "fire-smith", "wind-oracle"])).toEqual([]);
    expect(() => createRunState("run-seed", [])).toThrow("至少需要 1 名角色");
    expect(() => createRunState("run-seed", ["a", "b", "c", "d"])).toThrow("最多選 3 名");
    expect(() => createRunState("run-seed", ["a", "a"])).toThrow("不能重複");
  });

  it("assigns three, two, or one life to easy, normal, and hard Runs", () => {
    expect(createRunState("easy-seed", ["water-scout"], [], [], "easy")).toMatchObject({ difficulty: "easy", maxLives: 3, livesRemaining: 3 });
    expect(createRunState("normal-seed", ["water-scout"], [], [], "normal")).toMatchObject({ difficulty: "normal", maxLives: 2, livesRemaining: 2 });
    expect(createRunState("hard-seed", ["water-scout"], [], [], "hard")).toMatchObject({ difficulty: "hard", maxLives: 1, livesRemaining: 1 });
  });

  it("spends one life on a thirteen-card battle loss and only ends at zero", () => {
    const easy = createRunState("easy-loss", ["water-scout"], [], [], "easy");
    const afterFirstLoss = failCurrentNode(easy);
    expect(afterFirstLoss).toMatchObject({ status: "active", livesRemaining: 2, currentNodeId: easy.currentNodeId });
    const afterSecondLoss = failCurrentNode(afterFirstLoss);
    expect(afterSecondLoss.status).toBe("active");
    expect(afterSecondLoss.livesRemaining).toBe(1);
    expect(failCurrentNode(afterSecondLoss)).toMatchObject({ status: "lost", livesRemaining: 0 });
  });

  it("spends two lives on an Elite loss and clears all lives on a Boss loss", () => {
    const easy = createRunState("elite-loss", ["water-scout"], [], [], "easy");
    const eliteRun = { ...easy, currentNodeId: easy.map.chapterEndNodeIds[0] };
    expect(failCurrentNode(eliteRun)).toMatchObject({ status: "active", livesRemaining: 1 });
    const normal = createRunState("elite-loss-normal", ["water-scout"], [], [], "normal");
    expect(failCurrentNode({ ...normal, currentNodeId: normal.map.chapterEndNodeIds[0] })).toMatchObject({ status: "lost", livesRemaining: 0 });
    const boss = createRunState("boss-loss", ["water-scout"], [], [], "easy");
    expect(failCurrentNode({ ...boss, currentNodeId: boss.finalBossId })).toMatchObject({ status: "lost", livesRemaining: 0 });
  });

  it("abandons an active Run without battle damage and clears pending battle effects", () => {
    const run = { ...createRunState("abandon-seed", ["water-scout"]), blessingIds: ["blessing-1"], nextBattleSkullCurse: 1, discoveredRunFlags: ["next-battle:focus", "effect:ability-sight"], earnedCrystals: 12 };
    const abandoned = abandonRun(run);

    expect(abandoned).toMatchObject({ status: "lost", endReason: "abandoned", livesRemaining: run.livesRemaining, earnedCrystals: 12, blessingIds: [], nextBattleSkullCurse: 0 });
    expect(abandoned.discoveredRunFlags).toEqual(["effect:ability-sight"]);
    expect(abandonRun(abandoned)).toBe(abandoned);
  });

  it("consumes the next-battle focus effect after battle aftermath", () => {
    const run = { ...createRunState("focus-seed", ["water-scout"]), discoveredRunFlags: ["next-battle:focus", "effect:ability-sight"] };
    expect(resolveBattleAftermath(run, false, true).discoveredRunFlags).toEqual(["effect:ability-sight"]);
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
    const claimed = claimCurrentNodeReward(completed, { ...reward, geneChain: { id: "test-chain", targetSlot: "short3", factors: [{ suit: "water" }, { suit: "fire" }, { suit: "wind" }], enabledSlots: [true, true, true] } });

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
    const fullInventory: RunState["geneInventory"] = Array.from({ length: completed.geneCapacity }, (_, index) => ({ id: `chain-${index}`, targetSlot: "short3" as const, factors: [{ suit: "water" as const }, { suit: "fire" as const }, { suit: "wind" as const }], enabledSlots: [true, true, true] }));
    const fullRun = { ...completed, geneInventory: fullInventory };
    const node = fullRun.map.nodes.find((candidate) => candidate.id === nextId)!;
    const reward = rewardForNode(node);
    const geneChain: RunState["geneInventory"][number] = { id: "new-chain", targetSlot: "short3", factors: [{ suit: "earth" }, { suit: "water" }, { suit: "fire" }], enabledSlots: [true, true, true] };
    expect(() => claimCurrentNodeReward(fullRun, { ...reward, geneChain })).toThrow("基因庫已滿");
    const claimed = claimCurrentNodeReward(fullRun, { ...reward, geneChain }, { takeGene: false });
    expect(claimed.earnedCrystals).toBe(reward.crystals);
    expect(claimed.geneInventory).toHaveLength(fullRun.geneCapacity);
  });

  it("counts a repeated gene reward only once in the Run summary", () => {
    const base = createRunState("duplicate-gene-reward", ["water-scout"]);
    const firstNodeId = base.map.nodes[0].nextNodeIds[0];
    const firstNode = base.map.nodes.find((node) => node.id === firstNodeId)!;
    const firstClaim = claimCurrentNodeReward(completeCurrentNode(moveToNode(base, firstNodeId)), {
      ...rewardForNode(firstNode),
      geneChainId: "shared-gene",
      geneChain: { id: "shared-gene", targetSlot: "short3", factors: [{ suit: "water" }, { suit: "fire" }, { suit: "wind" }], enabledSlots: [true, true, true] },
    });
    const secondNodeId = firstNode.nextNodeIds[0];
    const secondNode = firstClaim.map.nodes.find((node) => node.id === secondNodeId)!;
    const secondClaim = claimCurrentNodeReward(completeCurrentNode(moveToNode(firstClaim, secondNodeId)), {
      ...rewardForNode(secondNode),
      geneChainId: "shared-gene",
      geneChain: { id: "shared-gene", targetSlot: "short3", factors: [{ suit: "water" }, { suit: "fire" }, { suit: "wind" }], enabledSlots: [true, true, true] },
    });

    expect(secondClaim.geneInventory.map((chain) => chain.id)).toEqual(["shared-gene"]);
    expect(secondClaim.earnedGeneChainIds).toEqual(["shared-gene"]);
  });

  it("stores relic rewards in the active Run", () => {
    const run = createRunState("relic-seed", ["water-scout"]);
    const nextId = run.map.nodes[0].nextNodeIds[0];
    const arrived = moveToNode(run, nextId);
    const completed = completeCurrentNode(arrived);
    const claimed = claimCurrentNodeReward(completed, { crystals: 18, relicId: "relic-1", title: "遺物", detail: "找到遺物" });
    expect(claimed.relicIds).toEqual(["relic-1"]);
  });

  it("marks an altar node reward as claimed so reload cannot reopen it", () => {
    const base = createRunState("altar-persist-seed", ["water-scout"]);
    const node = base.map.nodes.find((candidate) => candidate.type === "relic")!;
    const arrived = { ...base, currentNodeId: node.id };
    const completed = completeCurrentNode(arrived);
    const settled = applyRelicAltarSettlement(
      { ...completed, altarState: { seed: "altar", candidateRelicIds: ["relic-1", "relic-2"], faces: ["crystal", "crystal", null, null, null], lockedSkullIndices: [], skullCount: 0, graceUsed: false, rollCount: 1, status: "stopped", pendingRewards: { crystalPairs: 1, blessingCount: 0, relicReady: false }, securedRewards: { crystalPairs: 0, blessingCount: 0 }, protectsSmallRewards: false } },
      { status: "stopped", crystalPairs: 1, blessingCount: 0, relicReady: false, nextBattleSkullCurse: 0 },
    );
    expect(settled.claimedRewardNodeIds).toContain(node.id);
    expect(settled.altarState).toBeUndefined();
  });

  it("rejects forged altar reward quantities instead of trusting the UI caller", () => {
    const base = createRunState("altar-forgery", ["water-scout"]);
    const node = base.map.nodes.find((candidate) => candidate.type === "relic")!;
    const run = {
      ...completeCurrentNode({ ...base, currentNodeId: node.id }),
      altarState: { seed: "altar", candidateRelicIds: ["relic-1", "relic-2"], faces: ["crystal", "crystal", null, null, null] as Array<"crystal" | "relic" | "blessing" | "skull" | null>, lockedSkullIndices: [], skullCount: 0, graceUsed: false, rollCount: 1, status: "stopped" as const, pendingRewards: { crystalPairs: 1, blessingCount: 0, relicReady: false }, securedRewards: { crystalPairs: 0, blessingCount: 0 }, protectsSmallRewards: false },
    };

    expect(() => applyRelicAltarSettlement(run, { status: "stopped", crystalPairs: 999, blessingCount: 999, relicReady: false, nextBattleSkullCurse: 0 })).toThrow("祭壇結算資料已失效");
  });

  it("marks the boss node as a won run", () => {
    const run = createRunState("boss-seed", ["water-scout"]);
    const bossRun = { ...run, currentNodeId: run.finalBossId };
    expect(completeCurrentNode(bossRun).status).toBe("won");
  });

  it("keeps an earlier chapter Boss active until the final Boss", () => {
    const run = createRunState("chapter-boss-seed", ["water-scout"]);
    const firstBossId = run.map.chapterEndNodeIds[0];
    const firstBossRun = { ...run, currentNodeId: firstBossId };
    expect(completeCurrentNode(firstBossRun).status).toBe("active");
    expect(completeCurrentNode({ ...run, currentNodeId: run.finalBossId }).status).toBe("won");
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
