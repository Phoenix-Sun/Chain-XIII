import type { EquippedGenes, GeneChain } from "./template";
import { generateRunMap, type RunMap } from "./map";
import type { RunReward } from "./runRewards";

export type RunStatus = "active" | "won" | "lost";

export const MAX_PARTY_SIZE = 3;

export function validatePartyCharacterIds(partyCharacterIds: string[]): string[] {
  const errors: string[] = [];
  if (partyCharacterIds.length < 1) errors.push("至少需要 1 名角色才能開始遠征");
  if (partyCharacterIds.length > MAX_PARTY_SIZE) errors.push(`每趟遠征最多選 ${MAX_PARTY_SIZE} 名角色`);
  if (new Set(partyCharacterIds).size !== partyCharacterIds.length) errors.push("出戰角色不能重複");
  if (partyCharacterIds.some((characterId) => characterId.trim().length === 0)) errors.push("出戰角色 ID 不可為空白");
  return errors;
}

export interface RunState {
  seed: string;
  partyCharacterIds: string[];
  map: RunMap;
  geneInventory: GeneChain[];
  geneCapacity: number;
  equippedGenes: EquippedGenes;
  relicIds: string[];
  discoveredRunFlags: string[];
  completedNodeIds: string[];
  claimedRewardNodeIds: string[];
  earnedCrystals: number;
  earnedGeneChainIds: string[];
  currentNodeId: string;
  finalBossId: string;
  status: RunStatus;
}

export function createRunState(seed: string, partyCharacterIds: string[], initialGeneInventory: GeneChain[] = []): RunState {
  const partyErrors = validatePartyCharacterIds(partyCharacterIds);
  if (partyErrors.length > 0) throw new Error(partyErrors[0]);
  const map = generateRunMap(seed);
  return {
    seed,
    partyCharacterIds,
    map,
    geneInventory: [...initialGeneInventory],
    geneCapacity: 6,
    equippedGenes: {},
    relicIds: [],
    discoveredRunFlags: [],
    completedNodeIds: [map.startNodeId],
    claimedRewardNodeIds: [],
    earnedCrystals: 0,
    earnedGeneChainIds: [],
    currentNodeId: map.startNodeId,
    finalBossId: map.bossNodeId,
    status: "active",
  };
}

export function canMoveToNode(run: RunState, nodeId: string): boolean {
  return run.status === "active"
    && run.completedNodeIds.includes(run.currentNodeId)
    && !run.completedNodeIds.includes(nodeId)
    && run.map.nodes.find((node) => node.id === run.currentNodeId)?.nextNodeIds.includes(nodeId) === true;
}

export function moveToNode(run: RunState, nodeId: string): RunState {
  if (!canMoveToNode(run, nodeId)) throw new Error("只能前進到目前節點的相鄰路線");
  return { ...run, currentNodeId: nodeId };
}

export function getCurrentNode(run: RunState) {
  const node = run.map.nodes.find((candidate) => candidate.id === run.currentNodeId);
  if (!node) throw new Error("找不到目前節點");
  return node;
}

export function completeCurrentNode(run: RunState): RunState {
  if (run.status !== "active") throw new Error("這趟遠征已經結束");
  const current = getCurrentNode(run);
  if (run.completedNodeIds.includes(current.id)) return run;
  return {
    ...run,
    completedNodeIds: [...run.completedNodeIds, current.id],
    status: current.type === "boss" ? "won" : "active",
  };
}

export function failCurrentNode(run: RunState): RunState {
  if (run.status !== "active") return run;
  return { ...run, status: "lost" };
}

export function claimCurrentNodeReward(run: RunState, reward: RunReward, options: { takeGene?: boolean } = {}): RunState {
  const current = getCurrentNode(run);
  if (!run.completedNodeIds.includes(current.id)) throw new Error("完成節點後才能領取獎勵");
  if (run.claimedRewardNodeIds.includes(current.id)) throw new Error("這個節點的獎勵已領取");
  const takeGene = options.takeGene ?? true;
  if (takeGene && reward.geneChain && run.geneInventory.length >= run.geneCapacity) throw new Error("基因庫已滿，請先鍊成、丟棄或放棄這條基因鏈");
  const shouldAddGene = Boolean(takeGene && reward.geneChain && !run.geneInventory.some((chain) => chain.id === reward.geneChain?.id));
  return {
    ...run,
    claimedRewardNodeIds: [...run.claimedRewardNodeIds, current.id],
    geneInventory: shouldAddGene && reward.geneChain ? [...run.geneInventory, reward.geneChain] : run.geneInventory,
    relicIds: reward.relicId && !run.relicIds.includes(reward.relicId) ? [...run.relicIds, reward.relicId] : run.relicIds,
    earnedCrystals: run.earnedCrystals + reward.crystals,
    earnedGeneChainIds: takeGene && reward.geneChainId ? [...run.earnedGeneChainIds, reward.geneChainId] : run.earnedGeneChainIds,
  };
}
