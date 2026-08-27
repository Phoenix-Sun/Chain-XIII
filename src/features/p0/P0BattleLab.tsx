import { useMemo, useState } from "react";
import { drawThirteen, rankLabel, sortCards, SUIT_LABELS, SUIT_SYMBOLS, SUITS, type Card, type CardSortMode, type Suit } from "../../domain/cards";
import { emptyLanes, fillLastOpenLane, LANE_LABELS, LANE_SIZES, swapLanes, validateLayout, type LaneId, type Lanes } from "../../domain/layout";
import { evaluateHand } from "../../domain/hands";
import { currentSuitOf } from "../../domain/template";
import { resolveLaneElement } from "../../domain/elements";

const DEFAULT_SEED = "CHAIN-XIII-P0-001";

export interface P0BattleLabProps {
  onLayoutConfirmed?: (layout: Lanes, cards: Card[], laneElementOverrides?: Partial<Record<LaneId, Suit>>) => void;
  cards?: Card[];
  canShiftElement?: boolean;
  onElementShift?: (lane: LaneId, suit: Suit) => boolean;
  initialLaneElementOverrides?: Partial<Record<LaneId, Suit>>;
}

type CardZone = "hand" | LaneId;

function PlayingCard({ card, selected, selectionOrder, onClick }: { card: Card; selected: boolean; selectionOrder?: number; onClick: () => void }) {
  const suit = currentSuitOf(card);
  return <button type="button" className={`playing-card suit-${suit}${selected ? " is-selected" : ""}`} aria-label={`${SUIT_LABELS[suit]} ${rankLabel(card.rank)}`} aria-pressed={selected} onClick={onClick}>
    {selectionOrder !== undefined && <span className="selection-order" aria-hidden="true">{selectionOrder}</span>}
    <span className="playing-card-rank">{rankLabel(card.rank)}</span>
    <span className="playing-card-suit" aria-hidden="true">{SUIT_SYMBOLS[suit]}</span>
    <span className="playing-card-name">{SUIT_LABELS[suit]}</span>
  </button>;
}

function Lane({ lane, cards, selectedIds, selectionOrder, targetLane, onSelect, onClear }: { lane: LaneId; cards: Card[]; selectedIds: Set<string>; selectionOrder: Map<string, number>; targetLane: LaneId | null; onSelect: (card: Card) => void; onClear: () => void }) {
  const expected = LANE_SIZES[lane];
  const rank = cards.length === expected ? evaluateHand(cards) : null;
  const isTarget = targetLane === lane && cards.length < expected;
  return <section className={`lane lane-${lane}${isTarget ? " is-target" : ""}`} aria-labelledby={`${lane}-lane-title`} aria-current={isTarget ? "step" : undefined}>
    <div className="lane-heading"><div><span className="lane-label" id={`${lane}-lane-title`}>{LANE_LABELS[lane]}</span><span className="lane-size">{cards.length}/{expected}</span></div><div className="lane-heading-actions"><span className="lane-hint">{rank?.label ?? (isTarget ? "下一步" : "待配置")}</span><button type="button" className="lane-clear" disabled={cards.length === 0} onClick={onClear}>收回{LANE_LABELS[lane]}</button></div></div>
    <div className="lane-cards">
      {cards.length === 0 && <span className="lane-empty">從手牌選 {expected} 張後一次放入</span>}
      {cards.map((card) => <PlayingCard key={card.id} card={card} selected={selectedIds.has(card.id)} selectionOrder={selectionOrder.get(card.id)} onClick={() => onSelect(card)} />)}
    </div>
  </section>;
}

export default function P0BattleLab({ onLayoutConfirmed, cards: providedCards, canShiftElement = false, onElementShift, initialLaneElementOverrides }: P0BattleLabProps = {}) {
  const [cards] = useState(() => providedCards ?? drawThirteen(DEFAULT_SEED));
  const [lanes, setLanes] = useState<Lanes>(() => emptyLanes());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<CardSortMode>("rank");
  const [notice, setNotice] = useState("先選 3 張牌組成頭墩，或選 5 張牌組成中／尾墩。");
  const [laneElementOverrides, setLaneElementOverrides] = useState<Partial<Record<LaneId, Suit>>>(() => ({ ...initialLaneElementOverrides }));
  const [elementShiftMode, setElementShiftMode] = useState(false);
  const [elementShiftUsed, setElementShiftUsed] = useState(false);

  const assignedIds = useMemo(() => new Set([...lanes.front, ...lanes.middle, ...lanes.back].map((card) => card.id)), [lanes]);
  const hand = useMemo(() => sortCards(cards.filter((card) => !assignedIds.has(card.id)), sortMode), [assignedIds, cards, sortMode]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectionOrder = useMemo(() => new Map(selectedIds.map((id, index) => [id, index + 1])), [selectedIds]);
  const selectedCards = useMemo(() => cards.filter((card) => selectedSet.has(card.id)), [cards, selectedSet]);
  const selectedZone: CardZone | null = selectedIds.length === 0 ? null : assignedIds.has(selectedIds[0]) ? (["front", "middle", "back"] as LaneId[]).find((lane) => lanes[lane].some((card) => card.id === selectedIds[0])) ?? null : "hand";
  const validation = useMemo(() => validateLayout(lanes), [lanes]);
  const formedElementLanes = useMemo(() => (["front", "middle", "back"] as LaneId[]).filter((lane) => lanes[lane].length === LANE_SIZES[lane] && resolveLaneElement(lanes[lane]) !== null), [lanes]);
  const assignedCount = cards.length - hand.length;
  const selectedCount = selectedIds.length;
  const lastLaneFill = useMemo(() => fillLastOpenLane(lanes, hand), [hand, lanes]);
  const targetLane = useMemo<LaneId | null>(() => {
    if (selectedZone && selectedZone !== "hand") return selectedZone;
    const emptyLanes = (["front", "middle", "back"] as LaneId[]).filter((lane) => lanes[lane].length === 0);
    if (emptyLanes.length === 0) return null;
    if (selectedCount >= 3 && selectedCount <= 5) {
      if (selectedCount === 3 && emptyLanes.includes("front")) return "front";
      return emptyLanes.find((lane) => lane === "middle" || lane === "back") ?? null;
    }
    return emptyLanes[0] ?? null;
  }, [lanes, selectedCount, selectedZone]);

  function toggleCard(card: Card, zone: CardZone) {
    if (selectedSet.has(card.id)) {
      setSelectedIds((current) => current.filter((id) => id !== card.id));
      return;
    }
    if (selectedZone && selectedZone !== zone) {
      setNotice("一次只能整理同一區的牌；請先完成目前選取，或重新點選。");
      return;
    }
    if (selectedCount >= 5) {
      setNotice("一次最多選 5 張牌。");
      return;
    }
    setSelectedIds((current) => [...current, card.id]);
  }

  function placeSelected(lane: LaneId) {
    if (selectedZone !== "hand") return;
    const required = LANE_SIZES[lane];
    if (selectedCount !== required) return;
    if (lanes[lane].length + selectedCount > required) {
      setNotice(`${LANE_LABELS[lane]}已有牌，請先把原本的牌退回手牌。`);
      return;
    }
    setLanes((current) => ({ ...current, [lane]: [...current[lane], ...selectedCards] }));
    setSelectedIds([]);
    setNotice(`已將 ${required} 張牌放入${LANE_LABELS[lane]}。`);
  }

  function returnSelectedToHand() {
    if (!selectedZone || selectedZone === "hand") return;
    setLanes((current) => ({ ...current, [selectedZone]: current[selectedZone].filter((card) => !selectedSet.has(card.id)) }));
    setLaneElementOverrides((current) => {
      const next = { ...current };
      delete next[selectedZone];
      return next;
    });
    setSelectedIds([]);
    setNotice(`已將選取的牌退回手牌。`);
  }

  function clearLane(lane: LaneId) {
    if (lanes[lane].length === 0) return;
    setLanes((current) => ({ ...current, [lane]: [] }));
    setLaneElementOverrides((current) => {
      const next = { ...current };
      delete next[lane];
      return next;
    });
    setSelectedIds([]);
    setNotice(`已將${LANE_LABELS[lane]}全部退回手牌。`);
  }

  function swapMiddleAndBack() {
    if (lanes.middle.length === 0 || lanes.back.length === 0) {
      setNotice("中墩與尾墩都要先放入牌，才能互換。");
      return;
    }
    setLanes((current) => swapLanes(current, "middle", "back"));
    setLaneElementOverrides((current) => ({ ...current, middle: current.back, back: current.middle }));
    setSelectedIds([]);
    setNotice("中墩與尾墩已互換，請檢查牌型順序。");
  }

  function fillLastLane() {
    if (!lastLaneFill) return;
    setLanes(lastLaneFill.lanes);
    setLaneElementOverrides((current) => {
      const next = { ...current };
      delete next[lastLaneFill.lane];
      return next;
    });
    setSelectedIds([]);
    setNotice(`已將剩餘 ${hand.length} 張牌補入${LANE_LABELS[lastLaneFill.lane]}。仍可逐張撤回。`);
  }

  function confirmLayout() {
    if (!validation.valid) {
      setNotice(validation.errors[0] ?? "這副牌還不能提交。");
      return;
    }
    onLayoutConfirmed?.(lanes, cards, laneElementOverrides);
    setNotice("這副牌成立，準備進入三墩比較。");
  }

  function startElementShift() {
    if (formedElementLanes.length === 0) {
      setNotice("先完成一個元素墩，潮汐流轉才能調整它。");
      return;
    }
    setElementShiftMode(true);
    setNotice("選擇一個已形成的元素墩，再指定新的元素。");
  }

  function shiftElement(lane: LaneId, suit: Suit) {
    if (!onElementShift?.(lane, suit)) return;
    setLaneElementOverrides((current) => ({ ...current, [lane]: suit }));
    setElementShiftUsed(true);
    setElementShiftMode(false);
    setNotice(`${LANE_LABELS[lane]}已調整為${SUIT_LABELS[suit]}元素。`);
  }

  function selectionMessage() {
    if (selectedZone && selectedZone !== "hand") return `已選 ${selectedCount} 張，按「退回手牌」重新整理。`;
    if (selectedCount === 0) return "先選 3 張牌組成頭墩，或選 5 張牌組成中／尾墩。";
    if (selectedCount === 3) return "已選 3 張，可以放入頭墩。";
    if (selectedCount === 5) return "已選 5 張，可以放入中墩或尾墩。";
    const target = selectedCount < 3 ? `再選 ${3 - selectedCount} 張可放入頭墩` : `再選 ${5 - selectedCount} 張可放入中墩或尾墩`;
    return `已選 ${selectedCount} 張，${target}。`;
  }

  return <section className="card lab-card" aria-labelledby="p0-lab-title">
    <div className="section-heading lab-heading"><div><h2 id="p0-lab-title">排好這副牌</h2></div><span className="progress-pill">{assignedCount}/13</span></div>
    <p className="lab-intro">先整理手牌，再一次選 3 張或 5 張放入對應墩位。牌可以退回重排。</p>
    <div className="notice" role="status">{notice}</div>
    {canShiftElement && !elementShiftUsed && <div className="element-shift-panel" aria-label="潮汐流轉">
      {!elementShiftMode ? <button type="button" className="ability-button" disabled={formedElementLanes.length === 0} onClick={startElementShift}>潮汐流轉・調整元素墩</button> : <div className="element-shift-options">
        <strong>選擇要改變的元素墩</strong>
        {formedElementLanes.map((lane) => {
          const currentElement = laneElementOverrides[lane] ?? resolveLaneElement(lanes[lane]);
          return <div className="element-shift-lane" key={lane}><span>{LANE_LABELS[lane]}・目前{currentElement ? SUIT_LABELS[currentElement] : "無"}</span><div>{SUITS.filter((suit) => suit !== currentElement).map((suit) => <button type="button" className="link-button" key={suit} onClick={() => shiftElement(lane, suit)}>{LANE_LABELS[lane]}改成{SUIT_LABELS[suit]}</button>)}</div></div>;
        })}
      </div>}
    </div>}

    <div className="hand-area hand-area-primary"><div className="subsection-heading"><div><h3>手牌</h3><span className="hand-instruction">點牌選取，再一次放入墩位</span></div><strong>{hand.length} 張</strong></div>
      <div className="sort-control" aria-label="手牌排序"><span>排列</span>{([ ["rank", "點數"], ["suit-rank", "花色"] ] as const).map(([mode, label]) => <button type="button" key={mode} className={sortMode === mode ? "is-active" : ""} aria-pressed={sortMode === mode} onClick={() => setSortMode(mode)}>{label}</button>)}</div>
      <div className="card-grid" aria-label="未配置手牌">{hand.map((card) => <PlayingCard key={card.id} card={card} selected={selectedSet.has(card.id)} selectionOrder={selectionOrder.get(card.id)} onClick={() => toggleCard(card, "hand")} />)}{hand.length === 0 && <p className="empty-hand">13 張牌都已分墩，檢查牌型順序後即可確認。</p>}</div>
    </div>

    <div className="placement-actions" aria-label="批次分墩操作">
      <span className="action-label">{selectionMessage()}</span>
      {selectedZone === "hand" && <>
        <button type="button" className="lane-action action-front" disabled={selectedCount !== 3 || lanes.front.length > 0} onClick={() => placeSelected("front")}>放入頭墩</button>
        <button type="button" className="lane-action action-middle" disabled={selectedCount !== 5 || lanes.middle.length > 0} onClick={() => placeSelected("middle")}>放入中墩</button>
        <button type="button" className="lane-action action-back" disabled={selectedCount !== 5 || lanes.back.length > 0} onClick={() => placeSelected("back")}>放入尾墩</button>
      </>}
      {selectedZone !== "hand" && <button type="button" className="link-button" onClick={returnSelectedToHand}>退回手牌</button>}
      {lastLaneFill && <button type="button" className="lane-action action-fill" onClick={fillLastLane}>補齊{LANE_LABELS[lastLaneFill.lane]}（{hand.length} 張）</button>}
      <button type="button" className="lane-action action-swap" disabled={lanes.middle.length === 0 || lanes.back.length === 0} onClick={swapMiddleAndBack}>中尾墩互換</button>
      {selectedCount > 0 && <button type="button" className="link-button" onClick={() => setSelectedIds([])}>清除選取</button>}
    </div>

    <div className="lanes" aria-label="十三支分墩區">
      <Lane lane="front" cards={lanes.front} selectedIds={selectedSet} selectionOrder={selectionOrder} targetLane={targetLane} onSelect={(card) => toggleCard(card, "front")} onClear={() => clearLane("front")} />
      <Lane lane="middle" cards={lanes.middle} selectedIds={selectedSet} selectionOrder={selectionOrder} targetLane={targetLane} onSelect={(card) => toggleCard(card, "middle")} onClear={() => clearLane("middle")} />
      <Lane lane="back" cards={lanes.back} selectedIds={selectedSet} selectionOrder={selectionOrder} targetLane={targetLane} onSelect={(card) => toggleCard(card, "back")} onClear={() => clearLane("back")} />
    </div>

    <div className={`validation ${validation.valid ? "is-valid" : "is-invalid"}`}><strong>{validation.valid ? "合法分墩" : "尚未成立"}</strong>{!validation.valid && <span>{validation.errors[0] ?? "繼續配置 13 張牌。"}</span>}{validation.valid && <span>尾墩 ≥ 中墩 ≥ 頭墩，可以確認。</span>}</div>
    <button type="button" className="primary-button" disabled={!validation.valid} onClick={confirmLayout}>確認這副牌</button>
  </section>;
}