import { useState } from "react";
import { rollExploration, type ExplorationResult } from "../domain/exploration";
import type { RunMapNode } from "../domain/map";
import { catalog } from "../content/catalog";

export default function ExplorationView({ node, seed, onResolved }: { node: RunMapNode; seed: string; onResolved: (result: ExplorationResult) => void }) {
  const [result, setResult] = useState<ExplorationResult>();
  const event = catalog.events.find((candidate) => candidate.id === node.eventId);
  const eventNumber = Number((node.eventId ?? "event-1").replace("event-", "")) || 1;
  const objective = event?.objective ?? (eventNumber % 2 === 0 ? "配置一組相同點數" : "總和達到 9");

  function roll() {
    const next = rollExploration(seed, node.eventId ?? "event-1");
    setResult(next);
    onResolved(next);
  }

  return <section className="exploration-card" aria-labelledby="exploration-title">
    <span className="pixel-kicker">EXPLORATION · D6</span>
    <h1 id="exploration-title">{event?.name ?? "路線事件"}</h1>
    <p>{event?.content ?? "石桌上的骰子等待你做出決定。"}</p>
    <div className="exploration-objective"><strong>本次目標</strong><span>{objective}</span></div>
    {result && <div className={`exploration-roll${result.success ? " is-success" : " is-failed"}`} role="status"><strong>{result.rolls.join(" · ")}</strong><span>總和 {result.total}・{result.hasPair ? "有相同點數" : "沒有相同點數"}</span><small>{result.success ? "目標達成，取得完整事件獎勵。" : "未達成目標，但仍取得保底水晶。"}</small></div>}
    <button type="button" className="primary-button" onClick={roll} disabled={Boolean(result)}>{result ? "事件已處理" : "擲出 3 顆骰子"}</button>
  </section>;
}
