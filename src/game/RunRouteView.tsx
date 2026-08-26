import { useMemo, useState } from "react";
import { canMoveToNode, createRunState, moveToNode, type RunState } from "../domain/run";
import type { MapNodeType, RunMapNode } from "../domain/map";
import type { Navigate } from "./types";
import { catalog } from "../content/catalog";
import { monsterDisplayName } from "../content/display";
import { rewardForNode } from "../domain/runRewards";
import { executeEffect } from "../domain/effects";

const NODE_LABELS: Record<MapNodeType, string> = { battle: "戰", elite: "菁", event: "事", relic: "遺", caravan: "商", campfire: "火", lookout: "望", boss: "王" };
const NODE_NAMES: Record<MapNodeType, string> = { battle: "戰鬥", elite: "菁英", event: "事件", relic: "遺物祭壇", caravan: "商隊", campfire: "營火", lookout: "瞭望台", boss: "Boss" };

function contentNumber(id?: string): string {
  return id?.match(/(\d+)$/)?.[1] ?? "?";
}

function nodeAccessibleLabel(node: RunMapNode, monsterName?: string): string {
  const location = `第 ${node.row + 1} 層・第 ${node.column + 1} 格・第 ${node.chapter ?? 1} 章`;
  const detail = monsterName ? monsterName : node.type === "event" ? `事件 ${contentNumber(node.eventId)}` : node.type === "relic" ? `遺物 ${contentNumber(node.relicId)}` : node.type === "boss" ? `第 ${node.chapter ?? 1} 章 Boss` : "";
  return [NODE_NAMES[node.type], location, detail].filter(Boolean).join("・");
}

function routePreviewDetail(node: RunMapNode, monsterDropCount: number | undefined, reward: ReturnType<typeof rewardForNode>): string {
  if (monsterDropCount !== undefined) return `可能掉落 ${monsterDropCount} 種基因鏈`;
  if (node.type === "relic" && reward.relicId) {
    const relic = catalog.relics.find((candidate) => candidate.id === reward.relicId);
    if (relic) return `可取得：${relic.name}`;
  }
  if (node.type === "event") {
    const event = node.eventId ? catalog.events.find((candidate) => candidate.id === node.eventId) : undefined;
    if (event) return `${event.name}・目標：${event.objective}・可能獎勵：水晶、基因鏈、遺物`;
  }
  if (node.type === "caravan") return "消耗水晶，在補給、備戰、情報中三選一";
  if (node.type === "campfire") return "回復 1 命，或免費準備下一場戰鬥";
  if (node.type === "lookout") return "查看下一層路線，不改變可達節點";
  return reward.detail;
}

function routeNodeState(node: RunMapNode, currentNodeId: string, reachableIds: Set<string>, completedIds: Set<string>): string {
  if (node.id === currentNodeId) return "目前位置";
  if (completedIds.has(node.id)) return "已完成";
  if (reachableIds.has(node.id)) return "可前往";
  return "未開放";
}

function nodePosition(node: RunMapNode, maxColumns: number, maxRow: number, rowHeight: number) {
  return {
    x: ((node.column + 0.5) / maxColumns) * 100,
    y: (maxRow - node.row + 0.5) * rowHeight,
  };
}

interface RunRouteViewProps {
  partyCharacterIds?: string[];
  run?: RunState;
  onNodeSelected?: (run: RunState, node: RunMapNode) => void;
  onNavigate?: Navigate;
  onOpenWorkshop?: () => void;
  onRunUpdated?: (run: RunState) => void;
}

export default function RunRouteView({ partyCharacterIds = ["water-scout"], run, onNodeSelected, onNavigate, onOpenWorkshop, onRunUpdated }: RunRouteViewProps) {
  const [internalRun, setInternalRun] = useState<RunState>(() => createRunState("CHAIN-XIII-RUN-001", partyCharacterIds));
  const [mapNotice, setMapNotice] = useState<string>();
  const [mapUsed, setMapUsed] = useState(false);
  const activeRun = run ?? internalRun;
  const current = activeRun.map.nodes.find((node) => node.id === activeRun.currentNodeId)!;
  const reachableIds = useMemo(() => new Set(current.nextNodeIds), [current.nextNodeIds]);
  const completedIds = useMemo(() => new Set(activeRun.completedNodeIds), [activeRun.completedNodeIds]);
  const rows = useMemo(() => Array.from(new Set(activeRun.map.nodes.map((node) => node.row))).sort((a, b) => a - b), [activeRun.map.nodes]);
  const reachableNodes = current.nextNodeIds.map((id) => activeRun.map.nodes.find((node) => node.id === id)).filter((node): node is RunMapNode => Boolean(node));
  const hasMapAbility = partyCharacterIds.some((characterId) => catalog.characters.find((character) => character.id === characterId)?.activeAbilityId === "ability-map");
  const hasStarMapRelic = activeRun.relicIds.includes("relic-18");
  const hasRouteReveal = activeRun.discoveredRunFlags.includes(`route:next-layer-revealed:${activeRun.currentNodeId}`);
  const chapterEnd = activeRun.map.nodes.find((node) => node.id === activeRun.map.chapterEndNodeIds[(current.chapter ?? 1) - 1])
    ?? activeRun.map.nodes.filter((node) => node.type === "boss").find((node) => node.chapter === current.chapter)
    ?? activeRun.map.nodes.find((node) => node.id === activeRun.map.bossNodeId)
    ?? current;

  function revealNextLayer() {
    if (!hasMapAbility || mapUsed || activeRun.discoveredRunFlags.includes("effect:ability-map")) return;
    const sourceId = partyCharacterIds.find((characterId) => catalog.characters.find((character) => character.id === characterId)?.activeAbilityId === "ability-map") ?? "ability-map";
    const effectResult = executeEffect("ability-map", { phase: "map-preview", run: activeRun, sourceId });
    if (!effectResult.applied) return;
    const nextLayer = activeRun.map.nodes.filter((node) => node.row === current.row + 1);
    const layerSummary = nextLayer.length > 0 ? nextLayer.map((node) => NODE_NAMES[node.type]).join("、") : "已經抵達終點";
    setMapNotice(`下一層揭示：${layerSummary}。石碑記錄已加入本趟遠征。`);
    setMapUsed(true);
    if (run) onRunUpdated?.(effectResult.run);
    else setInternalRun(effectResult.run);
  }

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

  const maxRow = rows.at(-1) ?? 0;
  const maxColumns = Math.max(...activeRun.map.nodes.map((node) => node.column + 1), 1);
  const rowHeight = 82;
  const mapHeight = Math.max((maxRow + 1) * rowHeight, 520);

  return <section className="route-card" aria-labelledby="route-title">
    <div className="route-heading"><div><span className="pixel-kicker">三章遠征地圖</span><h2 id="route-title">選擇下一站</h2></div><span className="route-boss">第 1／2 章菁英・第 3 章 Boss</span></div>
    <div className="route-status route-status-top"><span><b>第 {current.chapter ?? 1} 章</b>・{NODE_NAMES[current.type]}</span><span>距離本章終點：{Math.max(chapterEnd.row - current.row, 0)} 層</span><span>已完成：{activeRun.completedNodeIds.length} 個節點</span></div>
    <p className="route-intro">沿著發光路線穿過三個章節。第 1、2 章最後是菁英，第 3 章最後是 Boss；只有和目前位置相連的節點可以前往。</p>
    {(hasMapAbility || hasStarMapRelic || hasRouteReveal) && <div className="route-ability-panel">{hasMapAbility && <button type="button" className="ability-button" onClick={revealNextLayer} disabled={mapUsed || activeRun.discoveredRunFlags.includes("effect:ability-map")}>石碑揭示下一層{mapUsed || activeRun.discoveredRunFlags.includes("effect:ability-map") ? "・已用" : ""}</button>}{hasStarMapRelic && <p className="route-relic-notice"><strong>星圖碎片</strong>你可以直接閱讀下一層節點類型。</p>}{hasRouteReveal && <div className="route-next-layer"><strong>路線情報已揭示・下一層</strong>{activeRun.map.nodes.filter((node) => node.row === current.row + 1).map((node) => <span key={node.id}>{NODE_NAMES[node.type]}</span>)}</div>}{mapNotice && <p role="status">{mapNotice}</p>}</div>}
    <section className="expedition-map" aria-label="遠征地圖">
      <div className="expedition-map-legend" aria-label="路線圖例"><span><i className="legend-dot legend-current" />目前</span><span><i className="legend-dot legend-reachable" />可前往</span><span><i className="legend-dot legend-locked" />未開放</span></div>
      <div className="expedition-map-canvas" style={{ height: `${mapHeight}px` }}>
        <svg className="route-paths" viewBox={`0 0 100 ${mapHeight}`} preserveAspectRatio="none" aria-hidden="true">
          {activeRun.map.nodes.flatMap((node) => node.nextNodeIds.map((nextId) => {
            const nextNode = activeRun.map.nodes.find((candidate) => candidate.id === nextId);
            if (!nextNode) return null;
            const start = nodePosition(node, maxColumns, maxRow, rowHeight);
            const end = nodePosition(nextNode, maxColumns, maxRow, rowHeight);
            const isActive = node.id === current.id || completedIds.has(node.id) && (nextNode.id === current.id || reachableIds.has(nextNode.id));
            return <line data-testid="route-path" className={`route-path${isActive ? " is-active" : ""}`} key={`${node.id}-${nextId}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />;
          }))}
        </svg>
        {activeRun.map.nodes.map((node) => {
          const monster = node.monsterId ? catalog.monsters.find((candidate) => candidate.id === node.monsterId) : undefined;
          const state = routeNodeState(node, activeRun.currentNodeId, reachableIds, completedIds);
          const position = nodePosition(node, maxColumns, maxRow, rowHeight);
          return <div className={`route-map-node node-${node.type} state-${state === "目前位置" ? "current" : state === "可前往" ? "reachable" : state === "已完成" ? "completed" : "locked"}`} key={node.id} style={{ left: `${position.x}%`, top: `${position.y}px` }}>
            <button type="button" className={`route-node${node.id === activeRun.currentNodeId ? " is-current" : ""}${reachableIds.has(node.id) ? " is-reachable" : ""}${completedIds.has(node.id) ? " is-completed" : ""}`} disabled={!reachableIds.has(node.id)} onClick={() => travel(node.id)} aria-label={`${nodeAccessibleLabel(node, monster ? monsterDisplayName(monster) : undefined)}・${state}`} aria-pressed={node.id === activeRun.currentNodeId}>
              <span className="route-node-icon">{NODE_LABELS[node.type]}</span>
              <span className="route-node-name">{NODE_NAMES[node.type]}</span>
              <span className="route-node-state">{state}</span>
            </button>
          </div>;
        })}
      </div>
    </section>
    <div className="route-preview destination-sheet" aria-label="下一站資訊"><div className="destination-sheet-heading"><strong>下一站資訊</strong><small>點擊地圖節點查看路線</small></div>{reachableNodes.map((node) => { const monster = node.monsterId ? catalog.monsters.find((candidate) => candidate.id === node.monsterId) : undefined; const reward = rewardForNode(node); return <div className="route-preview-item" key={node.id}><span><strong>{NODE_NAMES[node.type]}{monster ? `・${monsterDisplayName(monster)}` : ""}</strong><small className="route-location">第 {node.row + 1} 層・第 {node.column + 1} 格</small></span><small>{routePreviewDetail(node, monster?.dropChainPoolIds.length, reward)}</small></div>; })}{hasStarMapRelic && <div className="route-next-layer"><strong>星圖碎片・下一層預覽</strong>{activeRun.map.nodes.filter((node) => node.row === current.row + 1).map((node) => <span key={node.id}>{NODE_NAMES[node.type]}</span>)}</div>}</div>
    <div className="route-status route-status-bottom"><span>下一步：{current.nextNodeIds.length} 個可達節點</span>{onOpenWorkshop && <button type="button" className="secondary-button" onClick={onOpenWorkshop}>配置基因鏈</button>}</div>
  </section>;
}