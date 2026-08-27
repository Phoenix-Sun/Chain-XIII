import { useEffect, useState } from "react";
import { abandonRun, applyRelicAltarSettlement, completeCurrentNode, claimCurrentNodeReward, createRunState, failCurrentNode, getCurrentNode, resolveBattleAftermath, type RunDifficulty, type RunState } from "../domain/run";
import { rewardForNode, scaleRewardCrystals, type RewardChoice, type RunReward } from "../domain/runRewards";
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
import RelicAltarView from "./RelicAltarView";
import ServiceNodeView from "./ServiceNodeView";
import { createRelicAltarState, type AltarSettlement } from "../domain/relicAltar";
import { altarRelicModifiers } from "../domain/relics";

export type RunSessionPhase = "route" | "battle" | "exploration" | "altar" | "service" | "reward" | "workshop" | "settlement";

function rewardForRunNode(node: RunMapNode, difficulty: RunDifficulty): RunReward {
  const reward = rewardForNode(node, difficulty);
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
  if (run.altarState) return "altar";
  if (node.id !== run.map.startNodeId && run.completedNodeIds.includes(node.id) && !run.claimedRewardNodeIds.includes(node.id)) return "reward";
  if (run.status !== "active") return "settlement";
  if (!run.completedNodeIds.includes(node.id) && ["battle", "elite", "boss"].includes(node.type)) return "battle";
  if (!run.completedNodeIds.includes(node.id) && node.type === "event") return "exploration";
  if (!run.completedNodeIds.includes(node.id) && ["caravan", "campfire", "lookout"].includes(node.type)) return "service";
  return "route";
}

function relicCandidatesForNode(node: RunMapNode): string[] {
  const primary = node.relicId ?? "relic-1";
  const number = Number(primary.match(/(\d+)$/)?.[1] ?? 1);
  const secondary = `relic-${number % catalog.relics.length + 1}`;
  return primary === secondary ? [primary, `relic-${(number + 1) % catalog.relics.length + 1}`] : [primary, secondary];
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
    return node.id !== activeRun.map.startNodeId && activeRun.completedNodeIds.includes(node.id) && !activeRun.claimedRewardNodeIds.includes(node.id) ? rewardForRunNode(node, activeRun.difficulty) : null;
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
    return rewardForRunNode(node, run.difficulty);
  }

  function selectNode(nextRun: RunState, node: typeof currentNode) {
    if (node.type === "battle" || node.type === "elite" || node.type === "boss") {
      setRun(nextRun);
      setPhase("battle");
      return;
    }
    if (node.type === "event") {
      setRun({ ...nextRun, explorationState: { nodeId: node.id, eventId: node.eventId ?? "event-1", attempt: 0, result: undefined, usedTrade: false } });
      setPhase("exploration");
      return;
    }
    if (["caravan", "campfire", "lookout"].includes(node.type)) {
      setRun(nextRun);
      setPhase("service");
      return;
    }
    const completed = completeCurrentNode(nextRun);
    setRun(completed);
    if (node.type === "relic") {
      const altar = createRelicAltarState(`${run.seed}:${node.id}`, relicCandidatesForNode(node), altarRelicModifiers(run.relicIds).protectSmallRewards);
      setRun({ ...completed, altarState: altar });
      setPhase("altar");
    } else {
      setReward(rewardForCurrentNode(node));
      setRewardError(null);
      setPhase("reward");
    }
  }

  function handleBattleComplete(result: BattleResult, usedActiveAbility = false) {
    const afterBattle = resolveBattleAftermath(run, usedActiveAbility, result.outcome === "win");
    if (result.outcome !== "win") {
      const afterLoss = failCurrentNode(afterBattle);
      setRun(afterLoss);
      if (afterLoss.status === "active") {
        setBattleAttempt((current) => current + 1);
        setPhase("battle");
      } else {
        setPhase("settlement");
      }
      return;
    }
    const completed = completeCurrentNode(afterBattle);
    setRun(completed);
    setReward(rewardForCurrentNode(currentNode));
    setRewardError(null);
    setPhase("reward");
  }

  function handleAltarStateChange(altarState: NonNullable<RunState["altarState"]>) {
    setRun((current) => ({ ...current, altarState }));
  }

  function handleAltarResolved(settlement: AltarSettlement, selectedRelicId?: string) {
    const settled = applyRelicAltarSettlement(run, settlement, selectedRelicId);
    setRun(settled);
    setPhase("route");
  }

  function handleExplorationComplete(success: boolean) {
    const completed = completeCurrentNode(run);
    const baseReward = rewardForCurrentNode(currentNode);
    const nextReward = success ? baseReward : { crystals: scaleRewardCrystals(4, run.difficulty), title: "事件退場", detail: "沒有達成事件目標，但你安全離開並保留了少量水晶。" };
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
      setPhase(currentNode.id === run.finalBossId ? "settlement" : "route");
    } catch (error) {
      setRewardError(error instanceof Error ? error.message : "目前無法領取這項獎勵");
    }
  }

  function leaveRun() {
    onRunSettled?.(run);
    onNavigate?.("town");
  }

  function abandonCurrentRun() {
    onRunSettled?.(abandonRun(run));
    onNavigate?.("town");
  }

  if (phase === "route") return <div className="run-session"><div className="run-progress"><span>遠征進行中</span><strong>{run.livesRemaining}/{run.maxLives} 命 · {run.earnedCrystals} 水晶 · 祝福 {run.blessingIds?.length ?? 0}</strong></div><p className="run-party-summary" aria-label="本次出戰隊伍">本次出戰：{partySummary(run.partyCharacterIds)}</p><RunRouteView run={run} partyCharacterIds={run.partyCharacterIds} onRunUpdated={setRun} onNodeSelected={selectNode} onOpenWorkshop={() => setPhase("workshop")} /></div>;
  if (phase === "battle") return <div className="run-session"><div className="run-progress"><span>第 {currentNode.chapter ?? 1} 章・目前節點：{currentNode.type === "boss" ? "Boss" : currentNode.type === "elite" ? "菁英" : "戰鬥"}</span><strong>{run.livesRemaining}/{run.maxLives} 命 · {run.earnedCrystals} 水晶</strong></div><p className="run-party-summary" aria-label="本次出戰隊伍">本次出戰：{partySummary(run.partyCharacterIds)}</p><BattleArenaView key={`battle-attempt-${currentNode.id}-${battleAttempt}`} partyCharacterIds={run.partyCharacterIds} node={currentNode} battleSeed={`${run.seed}:${currentNode.id}`} equippedGenes={run.equippedGenes} relicIds={run.relicIds} run={run} onRunUpdated={(nextRun) => setRun(nextRun)} onBattleComplete={handleBattleComplete} onAbandonRun={abandonCurrentRun} /></div>;
  if (phase === "exploration") return <div className="run-session"><div className="run-progress"><span>目前節點：事件</span><strong>{run.livesRemaining}/{run.maxLives} 命 · {run.earnedCrystals} 水晶</strong></div><p className="run-party-summary" aria-label="本次出戰隊伍">本次出戰：{partySummary(run.partyCharacterIds)}</p><ExplorationView node={currentNode} seed={run.seed} run={run} partyCharacterIds={run.partyCharacterIds} onRunUpdated={setRun} onResolved={(result) => handleExplorationComplete(result.success)} /></div>;
  if (phase === "altar") return <div className="run-session"><RelicAltarView seed={`${run.seed}:${currentNode.id}`} relicIds={run.relicIds} initialState={run.altarState} candidateRelicIds={run.altarState?.candidateRelicIds ?? relicCandidatesForNode(currentNode)} onStateChange={handleAltarStateChange} onResolved={handleAltarResolved} /></div>;
  if (phase === "service") return <div className="run-session"><ServiceNodeView node={currentNode} run={run} onResolved={(nextRun) => { setRun(nextRun); setPhase("route"); }} /></div>;
  if (phase === "reward" && reward) return <div className="run-session"><RunRewardView node={currentNode} difficulty={run.difficulty} isFinalBoss={currentNode.id === run.finalBossId} reward={reward} inventoryCount={run.geneInventory.length} geneCapacity={run.geneCapacity} error={rewardError} initialChoiceId={run.pendingRewardChoice?.nodeId === currentNode.id ? run.pendingRewardChoice.choiceId : undefined} onChoiceChange={(choiceId) => setRun((current) => ({ ...current, pendingRewardChoice: { nodeId: currentNode.id, choiceId } }))} onClaim={(choice) => claimReward(true, choice)} onSkipGene={reward.geneChain ? () => claimReward(false) : undefined} /></div>;
  if (phase === "workshop") return <div className="run-session"><GeneWorkshopView run={run} partyCharacterIds={run.partyCharacterIds} onRunUpdated={setRun} initialInventory={run.geneInventory} initialEquipped={run.equippedGenes} onInventoryChange={(geneInventory) => setRun((current) => ({ ...current, geneInventory }))} onEquippedChange={(equippedGenes) => setRun((current) => ({ ...current, equippedGenes }))} onExit={() => setPhase("route")} /></div>;
  return <div className="run-session"><RunSettlementView run={run} onExit={leaveRun} /></div>;
}
