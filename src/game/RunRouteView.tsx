import { useMemo, useState } from "react";
import { canMoveToNode, createRunState, moveToNode, type RunState } from "../domain/run";
import type { MapNodeType } from "../domain/map";

const NODE_LABELS: Record<MapNodeType, string> = { battle: "戰", elite: "精", event: "事", relic: "器", boss: "王" };
const NODE_NAMES: Record<MapNodeType, string> = { battle: "普通戰鬥", elite: "Elite 挑戰", event: "探索事件", relic: "神器節點", boss: "最終 Boss" };

export default function RunRouteView() {
  const [run, setRun] = useState<RunState>(() => createRunState("CHAIN-XIII-RUN-001", ["water-scout", "fire-smith", "wind-oracle"]));
  const current = run.map.nodes.find((node) => node.id === run.currentNodeId)!;
  const reachableIds = useMemo(() => new Set(current.nextNodeIds), [current.nextNodeIds]);
  const rows = useMemo(() => Array.from(new Set(run.map.nodes.map((node) => node.row))).sort((a, b) => a - b), [run.map.nodes]);

  function travel(nodeId: string) {
    if (!canMoveToNode(run, nodeId)) return;
    setRun((currentRun) => moveToNode(currentRun, nodeId));
  }

  return <section className="route-card" aria-labelledby="route-title"><div className="route-heading"><div><span className="pixel-kicker">RUN ROUTE · SEED {run.seed}</span><h2 id="route-title">單向節點地圖</h2></div><span className="route-boss">終點：{run.finalBossId}</span></div><p className="route-intro">只能走目前節點連出去的下一層；提早知道 Boss，沿路規劃鏈與神器。</p><div className="route-rows">{rows.map((row) => <div className="route-row" key={row}><small>第 {row + 1} 層</small><div className="route-nodes">{run.map.nodes.filter((node) => node.row === row).map((node) => <button type="button" key={node.id} className={`route-node node-${node.type}${node.id === run.currentNodeId ? " is-current" : ""}${reachableIds.has(node.id) ? " is-reachable" : ""}`} disabled={!reachableIds.has(node.id)} onClick={() => travel(node.id)} aria-label={`${NODE_NAMES[node.type]} ${node.id}`}><strong>{NODE_LABELS[node.type]}</strong><small>{node.id.replace("r", "R").replace("n", " N")}</small></button>)}</div></div>)}</div><div className="route-status"><span>目前：{NODE_NAMES[current.type]}</span><span>{current.id}</span><span>下一步：{current.nextNodeIds.length} 個可達節點</span></div></section>;
}
