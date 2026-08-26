import { useMemo, useState } from "react";
import { catalog } from "../content/catalog";
import { altarRelicModifiers } from "../domain/relics";
import { createRelicAltarState, faceLabel, rollAltar, settleAltar, stopAltar, type RelicAltarState, type AltarSettlement } from "../domain/relicAltar";

const FACE_ICONS = { crystal: "✦", relic: "◆", blessing: "☼", skull: "☠" } as const;

export default function RelicAltarView({ seed, relicIds, initialState, candidateRelicIds, onStateChange, onResolved }: { seed: string; relicIds: string[]; initialState?: RelicAltarState; candidateRelicIds: string[]; onStateChange?: (state: RelicAltarState) => void; onResolved: (settlement: AltarSettlement, selectedRelicId?: string) => void }) {
  const modifiers = altarRelicModifiers(relicIds);
  const [state, setState] = useState<RelicAltarState>(() => initialState ?? createRelicAltarState(seed, candidateRelicIds, modifiers.protectSmallRewards));
  const [selected, setSelected] = useState<number[]>([]);
  const [settlement, setSettlement] = useState<AltarSettlement | null>(() => state.status === "bust" || state.status === "stopped" ? settleAltar(state) : null);
  const [chosenRelic, setChosenRelic] = useState<string>();
  const candidates = useMemo(() => state.candidateRelicIds.map((id) => catalog.relics.find((relic) => relic.id === id)).filter((relic): relic is typeof catalog.relics[number] => Boolean(relic)), [state.candidateRelicIds]);

  function commit(next: RelicAltarState) {
    setState(next);
    setSelected([]);
    onStateChange?.(next);
    if (next.status === "bust") setSettlement(settleAltar(next));
  }

  function roll() {
    commit(rollAltar(state, selected, modifiers.ignoreFirstSkull));
  }

  function stop() {
    const next = stopAltar(state);
    commit(next);
    setSettlement(settleAltar(next));
  }

  function resolve() {
    if (!settlement) return;
    if (settlement.relicReady && !chosenRelic) return;
    onResolved(settlement, chosenRelic);
  }

  const isRolling = state.status === "ready" || state.status === "rolling";
  return <section className="relic-altar-card" aria-labelledby="relic-altar-title">
    <span className="pixel-kicker">RELIC ALTAR · PUSH YOUR LUCK</span>
    <h1 id="relic-altar-title">遺物祭壇</h1>
    <p>五顆定制骰一起投擲。保留想要的面，重骰其他非 Skull 骰；Skull 一旦鎖定就不能再選。</p>
    <div className={`altar-skull-counter${state.skullCount === 2 ? " is-danger" : ""}`} role="status"><strong>Skull：{state.skullCount} / 3</strong><span>{state.lockedSkullIndices.length} 顆 Skull 已鎖定{state.skullCount === 2 ? "・下一顆就會爆骰" : ""}</span></div>
    <div className="altar-dice" aria-label="五顆遺物祭壇骰子">{state.faces.map((face, index) => { const locked = state.lockedSkullIndices.includes(index); const isSelected = selected.includes(index); return <button type="button" className={`altar-die die-${face ?? "empty"}${locked ? " is-locked" : ""}${isSelected ? " is-selected" : ""}`} key={`altar-die-${index}`} disabled={!isRolling || locked || state.status === "ready"} aria-pressed={isSelected} aria-label={`${index + 1}號骰：${faceLabel(face)}${locked ? "・已鎖定" : ""}`} onClick={() => setSelected((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index])}><strong>{face ? FACE_ICONS[face] : "?"}</strong><span>{faceLabel(face)}</span>{locked && <small>鎖定</small>}</button>; })}</div>
    <div className="altar-reward-preview" aria-label="目前待收獎勵"><strong>目前成果</strong><span>水晶二連：{state.pendingRewards.crystalPairs > 0 ? `成立 ${state.pendingRewards.crystalPairs} 組` : "未成立"}</span><span>祝福二連：{state.pendingRewards.blessingCount > 0 ? `成立 ${state.pendingRewards.blessingCount} 個` : "未成立"}</span><span>遺物三連：{state.pendingRewards.relicReady ? "成立・二選一" : `未達標・還差 ${Math.max(0, 3 - state.faces.filter((face) => face === "relic").length)} 顆`}</span>{modifiers.protectSmallRewards && <small>收手印：已形成的小獎勵會被保護</small>}</div>
    {state.status === "ready" && <button type="button" className="primary-button" onClick={roll}>投擲五顆骰子</button>}
    {state.status === "rolling" && <div className="altar-actions"><button type="button" className="primary-button" disabled={selected.length === 0} onClick={roll}>重骰選取的 {selected.length} 顆</button><button type="button" className="secondary-button" onClick={stop}>收手並保留成果</button><small>不選骰子直接收手也是有效策略。</small></div>}
    {state.status === "bust" && <div className="altar-bust" role="alert"><strong>爆骰！</strong><span>未受保護的水晶／祝福成果消失；下一場戰鬥會承受 Skull 詛咒。遺物三連資格也失效。</span></div>}
    {settlement && state.status !== "bust" && settlement.relicReady && <div className="altar-candidates" role="radiogroup" aria-label="遺物二選一"><strong>遺物三連成立：選一件帶走</strong>{candidates.map((relic) => <button type="button" className={`altar-relic-choice${chosenRelic === relic.id ? " is-selected" : ""}`} aria-pressed={chosenRelic === relic.id} key={relic.id} onClick={() => setChosenRelic(relic.id)}><b>{relic.name}</b><small>{relic.trigger}</small><span>{relic.effect}</span><em>{relic.detail}</em></button>)}</div>}
    {settlement && <button type="button" className="primary-button" disabled={settlement.relicReady && !chosenRelic} onClick={resolve}>{state.status === "bust" ? "承受詛咒並離開" : settlement.relicReady ? "帶走選定遺物" : "領取成果並離開"}</button>}
  </section>;
}
