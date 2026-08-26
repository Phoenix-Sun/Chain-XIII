import { useEffect, useState } from "react";
import { completeCurrentNode, claimCurrentNodeReward, createRunState, failCurrentNode, getCurrentNode, type RunDifficulty, type RunState } from "../domain/run";
import { rewardForNode, type RewardChoice, type RunReward } from "../domain/runRewards";
import type { BattleResult } from "../domain/combat";
import type { Navigate } from "./types";
import RunRouteView from "./RunRouteView";
import RunRewardView from "./RunRewardView";
import RunSettlementView from "./RunSettlementView";
import BattleArenaView from "../features/p0/BattleArenaView";
import { catalog } from "../content/catalog";
import GeneWorkshopView from "./GeneWorkshopView";
import type { RunMapNode } from "../domain/map";
import ExplorationView from "./ExplorationView";

export type RunSessionPhase = "route" | "battle" | "exploration" | "reward" | "workshop" | "settlement";

function rewardForRunNode(node: RunMapNode): RunReward {
  const reward = rewardForNode(node);
  if (node.type !== "event") {
    const geneChain = reward.geneChainId ? catalog.geneChains.find((chain) => chain.id === reward.geneChainId) : undefined;
    return geneChain ? { ...reward, geneChain } : reward;
  }
  const event = catalog.events.find((candidate) => candidate.id === (node.eventId ?? "event-1"));
  const eventGeneId = event?.rewardIds.find((id) => catalog.geneChains.some((chain) => chain.id === id));
  const eventRelicId = event?.rewardIds.find((id) => catalog.relics.some((relic) => relic.id === id));
  const geneChain = eventGeneId ? catalog.geneChains.find((chain) => chain.id === eventGeneId) : undefined;
  const choices: RewardChoice[] = [
    ...(eventGeneId && geneChain ? [{ id: `gene:${eventGeneId}`, label: "帶走基因鏈", detail: "把這條基因鏈放進本趟遠征的基因庫。", geneChainId: eventGeneId, geneChain }] : []),
    ...(eventRelicId ? [{ id: `relic:${eventRelicId}`, label: "帶走遺物", detail: "把遺物裝入本趟遠征，後續戰鬥立即生效。", relicId: eventRelicId }] : []),
  ];
  return { ...reward, geneChainId: undefined, geneChain: undefined, relicId: undefined, choices };
}

function initialPhaseForRun(run: RunState): RunSessionPhase {
  const node = getCurrentNode(run);
  if (node.id !== run.map.startNodeId && run.completedNodeIds.includes(node.id) && !run.claimedRewardNodeIds.includes(node.id)) return "reward";
  if (run.status !== "active") return "settlement";
  if (!run.completedNodeIds.includes(node.id) && ["battle", "elite", "boss"].includes(node.type)) return "battle";
  if (!run.completedNodeIds.includes(node.id) && node.type === "event") return "exploration";
  return "route";
}

function partySummary(characterIds: string[]): string {
  return characterIds.map((id) => catalog.characters.find((character) => character.id === id)?.id.replaceAll("-", " ") ?? id).join("、");
}

export default function RunSessionView({ partyCharacterIds = ["water-scout"], difficulty = "normal", seed = "CHAIN-XIII-RUN-001", initialRun, initialGeneInventory = [], permanentSkillNodeIds = [], onNavigate, onRunUpdated, onRunSettled, onPhaseChange }: { partyCharacterIds?: string[]; difficulty?: RunDifficulty; seed?: string; initialRun?: RunState; initialGeneInventory?: RunState["geneInventory"]; permanentSkillNodeIds?: string[]; onNavigate?: Navigate; onRunUpdated?: (run: RunState) => void; onRunSettled?: (run: RunState) => void; onPhaseChange?: (phase: RunSessionPhase) => void }) {
  const initialSession = initialRun ?? createRunState(seed, partyCharacterIds, initialGeneInventory, permanentSkillNodeIds, difficulty);
  const [run, setRun] = useState<RunState>(() => initialSession);
  const [phase, setPhase] = useState<RunSessionPhase>(() => initialPhaseForRun(initialSession));
  const [reward, setReward] = useState<RunReward | null>(() => {
    const activeRun = initialSession;
    const node = getCurrentNode(activeRun);
    return node.id !== activeRun.map.startNodeId && activeRun.completedNodeIds.includes(node.id) && !activeRun.claimedRewardNodeIds.includes(node.id) ? rewardForRunNode(node) : null;
  });
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [battleAttempt, setBattleAttempt] = useState(0);

  const currentNode = getCurrentNode(run);

  useEffect(() => {
    onRunUpdated?.(run);
  }, [onRunUpdated, run]);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [onPhaseChange, phase]);

  function rewardForCurrentNode(node: typeof currentNode): RunReward {
    return rewardForRunNode(node);
  }

  function selectNode(nextRun: RunState, node: typeof currentNode) {
    if (node.type === "battle" || node.type === "elite" || node.type === "boss") {
      setRun(nextRun);
      setPhase("battle");
      return;
    }
    if (node.type === "event") {
      setRun(nextRun);
      setPhase("exploration");
      return;
    }
    const completed = completeCurrentNode(nextRun);
    setRun(completed);
    setReward(rewardForCurrentNode(node));
    setRewardError(null);
    setPhase("reward");
  }

  function handleBattleComplete(result: BattleResult) {
    if (result.outcome !== "win") {
      const afterLoss = failCurrentNode(run);
      setRun(afterLoss);
      if (afterLoss.status === "active") {
        setBattleAttempt((current) => current + 1);
        setPhase("battle");
      } else {
        setPhase("settlement");
      }
      return;
    }
    const completed = completeCurrentNode(run);
    setRun(completed);
    setReward(rewardForCurrentNode(currentNode));
    setRewardError(null);
    setPhase("reward");
  }

  function handleExplorationComplete(success: boolean) {
    const completed = completeCurrentNode(run);
    const baseReward = rewardForCurrentNode(currentNode);
    const nextReward = success ? baseReward : { crystals: 4, title: "事件退場", detail: "沒有達成事件目標，但你安全離開並保留了少量水晶。" };
    setRun(completed);
    setReward(nextReward);
    setRewardError(null);
    setPhase("reward");
  }

  function claimReward(takeGene = true, choice?: RewardChoice) {
    if (!reward) return;
    try {
      const selectedReward: RunReward = choice ? { ...reward, ...choice, choices: undefined } : reward;
      const claimed = claimCurrentNodeReward(run, selectedReward, { takeGene });
      setRun(claimed);
      setReward(null);
      setRewardError(null);
      setPhase(currentNode.type === "boss" ? "settlement" : "route");
    } catch (error) {
      setRewardError(error instanceof Error ? error.message : "目前無法領取這項獎勵");
    }
  }

  function leaveRun() {
    onRunSettled?.(run);
    onNavigate?.("town");
  }

  if (phase === "route") return <div className="run-session"><div className="run-progress"><span>遠征進行中</span><strong>{run.livesRemaining}/{run.maxLives} 命 · {run.earnedCrystals} 水晶</strong></div><p className="run-party-summary" aria-label="本次出戰隊伍">本次出戰：{partySummary(run.partyCharacterIds)}</p><RunRouteView run={run} partyCharacterIds={run.partyCharacterIds} onRunUpdated={setRun} onNodeSelected={selectNode} onOpenWorkshop={() => setPhase("workshop")} /></div>;
  if (phase === "battle") return <div className="run-session"><div className="run-progress"><span>目前節點：{currentNode.type === "boss" ? "Boss" : currentNode.type === "elite" ? "強敵" : "戰鬥"}</span><strong>{run.livesRemaining}/{run.maxLives} 命 · {run.earnedCrystals} 水晶</strong></div><p className="run-party-summary" aria-label="本次出戰隊伍">本次出戰：{partySummary(run.partyCharacterIds)}</p><BattleArenaView key={`battle-attempt-${currentNode.id}-${battleAttempt}`} partyCharacterIds={run.partyCharacterIds} node={currentNode} battleSeed={`${run.seed}:${currentNode.id}`} equippedGenes={run.equippedGenes} relicIds={run.relicIds} run={run} onRunUpdated={(nextRun) => setRun(nextRun)} onBattleComplete={handleBattleComplete} /></div>;
  if (phase === "exploration") return <div className="run-session"><div className="run-progress"><span>目前節點：事件</span><strong>{run.livesRemaining}/{run.maxLives} 命 · {run.earnedCrystals} 水晶</strong></div><p className="run-party-summary" aria-label="本次出戰隊伍">本次出戰：{partySummary(run.partyCharacterIds)}</p><ExplorationView node={currentNode} seed={run.seed} run={run} partyCharacterIds={run.partyCharacterIds} onRunUpdated={setRun} onResolved={(result) => handleExplorationComplete(result.success)} /></div>;
  if (phase === "reward" && reward) return <div className="run-session"><RunRewardView node={currentNode} reward={reward} inventoryCount={run.geneInventory.length} geneCapacity={run.geneCapacity} error={rewardError} onClaim={(choice) => claimReward(true, choice)} onSkipGene={reward.geneChain ? () => claimReward(false) : undefined} /></div>;
  if (phase === "workshop") return <div className="run-session"><GeneWorkshopView run={run} partyCharacterIds={run.partyCharacterIds} onRunUpdated={setRun} initialInventory={run.geneInventory} initialEquipped={run.equippedGenes} onInventoryChange={(geneInventory) => setRun((current) => ({ ...current, geneInventory }))} onEquippedChange={(equippedGenes) => setRun((current) => ({ ...current, equippedGenes }))} onExit={() => setPhase("route")} /></div>;
  return <div className="run-session"><RunSettlementView run={run} onExit={leaveRun} /></div>;
}
