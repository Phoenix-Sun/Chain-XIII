import { skillTreeModifiers } from "./skillTree";
import type { EquippedGenes, GeneChain } from "./template";
import { generateRunMap, type RunMap } from "./map";
import type { RunReward } from "./runRewards";
import { blessingIdsForCount } from "./blessings";
import type { AltarSettlement } from "./relicAltar";
import { ALTAR_CRYSTALS_PER_PAIR } from "./relicAltar";
import { battleVictoryCrystalBonus } from "./relics";

export type RunStatus = "active" | "won" | "lost";
export type RunDifficulty = "easy" | "normal" | "hard";

export const RUN_DIFFICULTIES: Record<RunDifficulty, { label: string; lives: number; detail: string }> = {
  easy: { label: "容易", lives: 3, detail: "普通戰敗可承受兩次；菁英與 Boss 仍會帶來更重懲罰。" },
  normal: { label: "中等", lives: 2, detail: "普通戰敗一次仍可繼續；菁英戰敗會直接耗盡命數。" },
  hard: { label: "困難", lives: 1, detail: "任何戰鬥失敗都會結束遠征。" },
};

export function startingLivesForDifficulty(difficulty: RunDifficulty): number {
  return RUN_DIFFICULTIES[difficulty].lives;
}

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
  difficulty: RunDifficulty;
  maxLives: number;
  livesRemaining: number;
  map: RunMap;
  geneInventory: GeneChain[];
  geneCapacity: number;
  equippedGenes: EquippedGenes;
  relicIds: string[];
  blessingIds?: string[];
  nextBattleSkullCurse?: number;
  altarState?: import("./relicAltar").RelicAltarState;
  permanentSkillNodeIds?: string[];
  discoveredRunFlags: string[];
  completedNodeIds: string[];
  claimedRewardNodeIds: string[];
  earnedCrystals: number;
  earnedGeneChainIds: string[];
  currentNodeId: string;
  finalBossId: string;
  status: RunStatus;
}

export function createRunState(seed: string, partyCharacterIds: string[], initialGeneInventory: GeneChain[] = [], permanentSkillNodeIds: string[] = [], difficulty: RunDifficulty = "normal"): RunState {
  const partyErrors = validatePartyCharacterIds(partyCharacterIds);
  if (partyErrors.length > 0) throw new Error(partyErrors[0]);
  const map = generateRunMap(seed);
  const modifiers = skillTreeModifiers(permanentSkillNodeIds);
  const maxLives = startingLivesForDifficulty(difficulty);
  return {
    seed,
    partyCharacterIds,
    difficulty,
    maxLives,
    livesRemaining: maxLives,
    map,
    geneInventory: [...initialGeneInventory],
    geneCapacity: 6 + modifiers.geneCapacityBonus,
    equippedGenes: {},
    relicIds: [],
    blessingIds: [],
    nextBattleSkullCurse: 0,
    permanentSkillNodeIds: [...permanentSkillNodeIds],
    discoveredRunFlags: [],
    completedNodeIds: [map.startNodeId],
    claimedRewardNodeIds: [],
    earnedCrystals: modifiers.startingCrystals,
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
    status: current.id === run.finalBossId ? "won" : "active",
  };
}

export function failCurrentNode(run: RunState): RunState {
  if (run.status !== "active") return run;
  const current = getCurrentNode(run);
  const damage = current.type === "boss" ? run.livesRemaining : current.type === "elite" ? 2 : 1;
  const livesRemaining = Math.max(0, run.livesRemaining - damage);
  return { ...run, livesRemaining, status: livesRemaining === 0 ? "lost" : "active" };
}

export function claimCurrentNodeReward(run: RunState, reward: RunReward, options: { takeGene?: boolean } = {}): RunState {
  const current = getCurrentNode(run);
  if (!run.completedNodeIds.includes(current.id)) throw new Error("完成節點後才能領取獎勵");
  if (run.claimedRewardNodeIds.includes(current.id)) throw new Error("這個節點的獎勵已領取");
  const takeGene = options.takeGene ?? true;
  const shouldAddGene = Boolean(takeGene && reward.geneChain && !run.geneInventory.some((chain) => chain.id === reward.geneChain?.id));
  if (shouldAddGene && run.geneInventory.length >= run.geneCapacity) throw new Error("基因庫已滿，請先替換或放棄一條基因鏈");
  return {
    ...run,
    claimedRewardNodeIds: [...run.claimedRewardNodeIds, current.id],
    geneInventory: shouldAddGene && reward.geneChain ? [...run.geneInventory, reward.geneChain] : run.geneInventory,
    relicIds: reward.relicId && !run.relicIds.includes(reward.relicId) ? [...run.relicIds, reward.relicId] : run.relicIds,
    earnedCrystals: run.earnedCrystals + reward.crystals,
    earnedGeneChainIds: takeGene && reward.geneChainId ? [...run.earnedGeneChainIds, reward.geneChainId] : run.earnedGeneChainIds,
  };
}

export function applyRelicAltarSettlement(run: RunState, settlement: AltarSettlement, selectedRelicId?: string): RunState {
  const altar = run.altarState;
  if (!altar) throw new Error("目前沒有進行中的遺物祭壇");
  if (settlement.relicReady && (!selectedRelicId || !altar.candidateRelicIds.includes(selectedRelicId))) throw new Error("遺物三連成立後必須選擇一件遺物");
  const newBlessings = blessingIdsForCount(settlement.blessingCount, `${run.seed}:${run.currentNodeId}`);
  return {
    ...run,
    earnedCrystals: run.earnedCrystals + settlement.crystalPairs * ALTAR_CRYSTALS_PER_PAIR,
    blessingIds: [...(run.blessingIds ?? []), ...newBlessings],
    relicIds: selectedRelicId && !run.relicIds.includes(selectedRelicId) ? [...run.relicIds, selectedRelicId] : run.relicIds,
    nextBattleSkullCurse: Math.max(run.nextBattleSkullCurse ?? 0, settlement.nextBattleSkullCurse),
    altarState: undefined,
  };
}

export function resolveBattleAftermath(run: RunState, usedActiveAbility: boolean, won: boolean): RunState {
  return {
    ...run,
    blessingIds: [],
    nextBattleSkullCurse: 0,
    earnedCrystals: run.earnedCrystals + (won ? battleVictoryCrystalBonus(run.relicIds, usedActiveAbility) : 0),
  };
}
