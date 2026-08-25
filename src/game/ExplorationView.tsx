import { useState } from "react";
import { objectiveLabel, objectiveForEvent, rollExploration, type ExplorationResult } from "../domain/exploration";
import { executeEffect } from "../domain/effects";
import type { RunMapNode } from "../domain/map";
import type { RunState } from "../domain/run";
import { catalog } from "../content/catalog";

export default function ExplorationView({ node, seed, run, partyCharacterIds = [], onRunUpdated, onResolved }: { node: RunMapNode; seed: string; run?: RunState; partyCharacterIds?: string[]; onRunUpdated?: (run: RunState) => void; onResolved: (result: ExplorationResult) => void }) {
  const [result, setResult] = useState<ExplorationResult>();
  const [attempt, setAttempt] = useState(0);
  const [usedTrade, setUsedTrade] = useState(false);
  const event = catalog.events.find((candidate) => candidate.id === node.eventId);
  const hasTradeAbility = partyCharacterIds.some((characterId) => catalog.characters.find((character) => character.id === characterId)?.activeAbilityId === "ability-trade");
  const objective = event?.objective ?? objectiveLabel(objectiveForEvent(node.eventId ?? "event-1"));

  function roll() {
    const next = rollExploration(seed, node.eventId ?? "event-1", attempt);
    setResult(next);
  }

  function rerollWithMerchant() {
    if (!run || usedTrade) return;
    const sourceId = partyCharacterIds.find((characterId) => catalog.characters.find((character) => character.id === characterId)?.activeAbilityId === "ability-trade") ?? "ability-trade";
    const effectResult = executeEffect("ability-trade", { phase: "exploration", run, sourceId });
    if (!effectResult.applied) return;
    onRunUpdated?.(effectResult.run);
    setUsedTrade(true);
    setAttempt((current) => current + 1);
    setResult(undefined);
  }

  return <section className="exploration-card" aria-labelledby="exploration-title">
    <span className="pixel-kicker">EXPLORATION · D6</span>
    <h1 id="exploration-title">{event?.name ?? "路線事件"}</h1>
    <p>{event?.content ?? "石桌上的骰子等待你做出決定。"}</p>
    <div className="exploration-objective"><strong>本次目標</strong><span>{objective}</span></div>
    {hasTradeAbility && <button type="button" className="ability-button" disabled={usedTrade || Boolean(!result)} onClick={rerollWithMerchant}>風行商人・重擲一次{usedTrade ? "・已用" : ""}</button>}
    {result && <div className={`exploration-roll${result.success ? " is-success" : " is-failed"}`} role="status"><strong>{result.rolls.join(" · ")}</strong><span>總和 {result.total}・{result.hasPair ? "有相同點數" : "沒有相同點數"}・{result.isStraight ? "連續點數" : "非連續點數"}</span><small>{result.success ? event?.successText ?? "目標達成，取得完整事件獎勵。" : event?.failureText ?? "未達成目標，但仍取得保底水晶。"}</small></div>}
    <button type="button" className="primary-button" onClick={() => result ? onResolved(result) : roll()}>{result ? "查看事件獎勵" : "擲出 3 顆骰子"}</button>
  </section>;
}
