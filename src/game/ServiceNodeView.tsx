import { useState } from "react";
import type { RunMapNode } from "../domain/map";
import type { RunState } from "../domain/run";
import { resolveServiceNode, SERVICE_COSTS, type ServiceChoice } from "../domain/serviceNodes";

const COPY: Record<ServiceChoice, { title: string; detail: string; button: string }> = {
  "caravan-heal": { title: "補給包", detail: "花 10 水晶，回復 1 點命數。", button: "購買補給" },
  "caravan-focus": { title: "戰術磨刀", detail: "花 8 水晶，下一場戰鬥三墩同牌型比較各 +1。", button: "磨刀備戰" },
  "caravan-scout": { title: "付費情報", detail: "花 6 水晶，揭示下一層節點類型。", button: "購買情報" },
  "campfire-rest": { title: "安靜休息", detail: "免費回復 1 點命數。", button: "休息" },
  "campfire-focus": { title: "火光演練", detail: "免費準備下一場戰鬥，三墩同牌型比較各 +1。", button: "開始演練" },
  "lookout-reveal": { title: "眺望路線", detail: "查看下一層的所有節點類型，不消耗水晶。", button: "展開地圖" },
};

export default function ServiceNodeView({ node, run, onResolved }: { node: RunMapNode; run: RunState; onResolved: (run: RunState) => void }) {
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const choices = node.type === "caravan" ? ["caravan-heal", "caravan-focus", "caravan-scout"] as ServiceChoice[] : node.type === "campfire" ? ["campfire-rest", "campfire-focus"] as ServiceChoice[] : ["lookout-reveal"] as ServiceChoice[];
  const title = node.type === "caravan" ? "流動商隊" : node.type === "campfire" ? "遠征營火" : "高地瞭望台";
  const intro = node.type === "caravan" ? "商隊不替你做決定，只提供三項明確交換。" : node.type === "campfire" ? "短暫停留，回復狀態或為下一場戰鬥準備。" : "站得更高，看清下一層路線，再決定是否承擔風險。";
  function choose(choice: ServiceChoice) {
    setBusy(true);
    try { onResolved(resolveServiceNode(run, node, choice)); } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "目前無法使用這項服務"); setBusy(false); }
  }
  return <section className={`service-node-card service-${node.type}`} aria-labelledby="service-node-title"><span className="pixel-kicker">ROUTE SUPPORT</span><h1 id="service-node-title">{title}</h1><p>{intro}</p><div className="service-choice-list">{choices.map((choice) => { const copy = COPY[choice]; const cost = SERVICE_COSTS[choice] ?? 0; const unavailable = run.earnedCrystals < cost || (choice.includes("heal") && run.livesRemaining >= run.maxLives); return <button type="button" className="service-choice" disabled={busy || unavailable} key={choice} onClick={() => choose(choice)}><span><b>{copy.title}</b><small>{copy.detail}</small></span><strong>{unavailable && choice.includes("heal") && run.livesRemaining >= run.maxLives ? "命數已滿" : cost > 0 ? `${cost} 水晶` : copy.button}</strong></button>; })}</div>{error && <p className="reward-error" role="alert">{error}</p>}</section>;
}
