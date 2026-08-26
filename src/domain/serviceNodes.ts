import type { RunMapNode } from "./map";
import type { RunState } from "./run";

export type ServiceChoice = "caravan-heal" | "caravan-focus" | "caravan-scout" | "campfire-rest" | "campfire-focus" | "lookout-reveal";

export const SERVICE_COSTS: Partial<Record<ServiceChoice, number>> = {
  "caravan-heal": 10,
  "caravan-focus": 8,
  "caravan-scout": 6,
};

function addFlag(run: RunState, flag: string): RunState {
  return run.discoveredRunFlags.includes(flag) ? run : { ...run, discoveredRunFlags: [...run.discoveredRunFlags, flag] };
}

export function serviceChoicesForNode(node: RunMapNode): ServiceChoice[] {
  if (node.type === "caravan") return ["caravan-heal", "caravan-focus", "caravan-scout"];
  if (node.type === "campfire") return ["campfire-rest", "campfire-focus"];
  if (node.type === "lookout") return ["lookout-reveal"];
  return [];
}

export function resolveServiceNode(run: RunState, node: RunMapNode, choice: ServiceChoice): RunState {
  if (run.status !== "active" || run.currentNodeId !== node.id) throw new Error("目前不能處理這個節點");
  if (!serviceChoicesForNode(node).includes(choice)) throw new Error("這個節點沒有這項選擇");
  const cost = SERVICE_COSTS[choice] ?? 0;
  if (run.earnedCrystals < cost) throw new Error(`需要 ${cost} 水晶才能使用這項服務`);
  let next: RunState = {
    ...run,
    earnedCrystals: run.earnedCrystals - cost,
    completedNodeIds: run.completedNodeIds.includes(node.id) ? run.completedNodeIds : [...run.completedNodeIds, node.id],
    claimedRewardNodeIds: run.claimedRewardNodeIds.includes(node.id) ? run.claimedRewardNodeIds : [...run.claimedRewardNodeIds, node.id],
  };
  if (choice === "caravan-heal" || choice === "campfire-rest") next = { ...next, livesRemaining: Math.min(next.maxLives, next.livesRemaining + 1) };
  if (choice === "caravan-focus" || choice === "campfire-focus") next = addFlag(next, "next-battle:focus");
  if (choice === "caravan-scout" || choice === "lookout-reveal") next = addFlag(next, `route:next-layer-revealed:${node.id}`);
  return next;
}
