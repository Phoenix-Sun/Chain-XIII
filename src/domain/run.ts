import type { EquippedGenes, GeneChain } from "./template";
import { generateRunMap, type RunMap } from "./map";

export type RunStatus = "active" | "won" | "lost";

export interface RunState {
  seed: string;
  partyCharacterIds: [string, string, string];
  map: RunMap;
  geneInventory: GeneChain[];
  geneCapacity: number;
  equippedGenes: EquippedGenes;
  relicIds: string[];
  discoveredRunFlags: string[];
  currentNodeId: string;
  finalBossId: string;
  status: RunStatus;
}

export function createRunState(seed: string, partyCharacterIds: [string, string, string]): RunState {
  const map = generateRunMap(seed);
  return {
    seed,
    partyCharacterIds,
    map,
    geneInventory: [],
    geneCapacity: 6,
    equippedGenes: {},
    relicIds: [],
    discoveredRunFlags: [],
    currentNodeId: map.startNodeId,
    finalBossId: map.bossNodeId,
    status: "active",
  };
}

export function canMoveToNode(run: RunState, nodeId: string): boolean {
  return run.status === "active" && run.map.nodes.find((node) => node.id === run.currentNodeId)?.nextNodeIds.includes(nodeId) === true;
}

export function moveToNode(run: RunState, nodeId: string): RunState {
  if (!canMoveToNode(run, nodeId)) throw new Error("只能前進到目前節點的相鄰路線");
  return { ...run, currentNodeId: nodeId };
}
