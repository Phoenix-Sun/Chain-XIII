import { useMemo, useState } from "react";
import { canMoveToNode, createRunState, moveToNode, type RunState } from "../domain/run";
import type { MapNodeType, RunMapNode } from "../domain/map";
import type { Navigate } from "./types";
import { catalog } from "../content/catalog";
import { monsterDisplayName } from "../content/display";
import { rewardForNode } from "../domain/runRewards";

const NODE_LABELS: Record<MapNodeType, string> = { battle: "戰", elite: "強", event: "事", relic: "獎", boss: "王" };
const NODE_NAMES: Record<MapNodeType, string> = { battle: "戰鬥", elite: "強敵", event: "事件", relic: "獎勵", boss: "Boss" };

function contentNumber(id?: string): string {
  return id?.match(/(\d+)$/)?.[1] ?? "?";
}

function nodeAccessibleLabel(node: RunMapNode, monsterName?: string): string {
  const location = `第 ${node.row + 1} 層・第 ${node.column + 1} 格`;
  const detail = monsterName ? monsterName : node.type === "event" ? `事件 ${contentNumber(node.eventId)}` : node.type === "relic" ? `遺物 ${contentNumber(node.relicId)}` : node.type === "boss" ? "最終 Boss" : "";
  return [NODE_NAMES[node.type], location, detail].filter(Boolean).join("・");
}

interface RunRouteViewProps {
  partyCharacterIds?: string[];
  run?: RunState;
  onNodeSelected?: (run: RunState, node: RunMapNode) => void;
  onNavigate?: Navigate;
  onOpenWorkshop?: () => void;
}

export default function RunRouteView({ partyCharacterIds = ["water-scout"], run, onNodeSelected, onNavigate, onOpenWorkshop }: RunRouteViewProps) {
  const [internalRun, setInternalRun] = useState<RunState>(() => createRunState("CHAIN-XIII-RUN-001", partyCharacterIds));
  const activeRun = run ?? internalRun;
  const current = activeRun.map.nodes.find((node) => node.id === activeRun.currentNodeId)!;
  const reachableIds = useMemo(() => new Set(current.nextNodeIds), [current.nextNodeIds]);
  const completedIds = useMemo(() => new Set(activeRun.completedNodeIds), [activeRun.completedNodeIds]);
  const rows = useMemo(() => Array.from(new Set(activeRun.map.nodes.map((node) => node.row))).sort((a, b) => a - b), [activeRun.map.nodes]);
  const reachableNodes = current.nextNodeIds.map((id) => activeRun.map.nodes.find((node) => node.id === id)).filter((node): node is RunMapNode => Boolean(node));

  function travel(nodeId: string) {
    if (!canMoveToNode(activeRun, nodeId)) return;
    const nextRun = moveToNode(activeRun, nodeId);
    const nextNode = nextRun.map.nodes.find((node) => node.id === nodeId)!;
    if (onNodeSelected) onNodeSelected(nextRun, nextNode);
    else {
      setInternalRun(nextRun);
      if (nextNode.type === "battle" || nextNode.type === "elite" || nextNode.type === "boss") onNavigate?.("battle");
    }
  }

  return <section className="route-card" aria-labelledby="route-title">
    <div className="route-heading"><div><span className="pixel-kicker">遠征路線</span><h2 id="route-title">選擇下一站</h2></div><span className="route-boss">終點：Boss</span></div>
    <p className="route-intro">只能前進到目前節點連出去的路線。完成目前節點後，下一層路線才會開啟。</p>
    <div className="route-preview" aria-label="下一站資訊"><strong>下一站資訊</strong>{reachableNodes.map((node) => { const monster = node.monsterId ? catalog.monsters.find((candidate) => candidate.id === node.monsterId) : undefined; const reward = rewardForNode(node); return <div className="route-preview-item" key={node.id}><span><strong>{NODE_NAMES[node.type]}{monster ? `・${monsterDisplayName(monster)}` : ""}</strong><small className="route-location">第 {node.row + 1} 層・第 {node.column + 1} 格</small></span><small>{monster ? `可能掉落 ${monster.dropChainPoolIds.length} 種基因鏈` : reward.detail}</small></div>; })}</div>
    <div className="route-rows">{rows.map((row) => <div className="route-row" key={row}><small>第 {row + 1} 層</small><div className="route-nodes">{activeRun.map.nodes.filter((node) => node.row === row).map((node) => { const monster = node.monsterId ? catalog.monsters.find((candidate) => candidate.id === node.monsterId) : undefined; return <button type="button" key={node.id} className={`route-node node-${node.type}${node.id === activeRun.currentNodeId ? " is-current" : ""}${reachableIds.has(node.id) ? " is-reachable" : ""}${completedIds.has(node.id) ? " is-completed" : ""}`} disabled={!reachableIds.has(node.id)} onClick={() => travel(node.id)} aria-label={nodeAccessibleLabel(node, monster ? monsterDisplayName(monster) : undefined)} aria-pressed={node.id === activeRun.currentNodeId}><strong>{NODE_LABELS[node.type]}</strong><small>{node.column + 1}</small></button>; })}</div></div>)}</div>
    <div className="route-status"><span>目前：{NODE_NAMES[current.type]}</span><span>已完成：{activeRun.completedNodeIds.length} 個節點</span><span>下一步：{current.nextNodeIds.length} 個可達節點</span></div>{onOpenWorkshop && <button type="button" className="secondary-button" onClick={onOpenWorkshop}>整理基因鏈</button>}
  </section>;
}