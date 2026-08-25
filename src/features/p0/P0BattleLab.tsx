import { useMemo, useState } from "react";
import { drawThirteen, rankLabel, sortCards, SUIT_LABELS, SUIT_SYMBOLS, type Card, type CardSortMode } from "../../domain/cards";
import { emptyLanes, LANE_LABELS, LANE_SIZES, validateLayout, type LaneId, type Lanes } from "../../domain/layout";
import { evaluateHand } from "../../domain/hands";
import { currentSuitOf } from "../../domain/template";

const DEFAULT_SEED = "CHAIN-XIII-P0-001";

export interface P0BattleLabProps {
  onLayoutConfirmed?: (layout: Lanes, cards: Card[]) => void;
  cards?: Card[];
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

function Lane({ lane, cards, selectedIds, selectionOrder, onSelect }: { lane: LaneId; cards: Card[]; selectedIds: Set<string>; selectionOrder: Map<string, number>; onSelect: (card: Card) => void }) {
  const expected = LANE_SIZES[lane];
  const rank = cards.length === expected ? evaluateHand(cards) : null;
  return <section className={`lane lane-${lane}`} aria-labelledby={`${lane}-lane-title`}>
    <div className="lane-heading"><div><span className="lane-label" id={`${lane}-lane-title`}>{LANE_LABELS[lane]}</span><span className="lane-size">{cards.length}/{expected}</span></div><span className="lane-hint">{rank?.label ?? "待配置"}</span></div>
    <div className="lane-cards">
      {cards.length === 0 && <span className="lane-empty">從手牌選 {expected} 張後一次放入</span>}
      {cards.map((card) => <PlayingCard key={card.id} card={card} selected={selectedIds.has(card.id)} selectionOrder={selectionOrder.get(card.id)} onClick={() => onSelect(card)} />)}
    </div>
  </section>;
}

export default function P0BattleLab({ onLayoutConfirmed, cards: providedCards }: P0BattleLabProps = {}) {
  const [cards] = useState(() => providedCards ?? drawThirteen(DEFAULT_SEED));
  const [lanes, setLanes] = useState<Lanes>(() => emptyLanes());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<CardSortMode>("deal");
  const [notice, setNotice] = useState("先選 3 張牌組成頭墩，或選 5 張牌組成中／尾墩。");

  const assignedIds = useMemo(() => new Set([...lanes.front, ...lanes.middle, ...lanes.back].map((card) => card.id)), [lanes]);
  const hand = useMemo(() => sortCards(cards.filter((card) => !assignedIds.has(card.id)), sortMode), [assignedIds, cards, sortMode]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectionOrder = useMemo(() => new Map(selectedIds.map((id, index) => [id, index + 1])), [selectedIds]);
  const selectedCards = useMemo(() => cards.filter((card) => selectedSet.has(card.id)), [cards, selectedSet]);
  const selectedZone: CardZone | null = selectedIds.length === 0 ? null : assignedIds.has(selectedIds[0]) ? (["front", "middle", "back"] as LaneId[]).find((lane) => lanes[lane].some((card) => card.id === selectedIds[0])) ?? null : "hand";
  const validation = useMemo(() => validateLayout(lanes), [lanes]);
  const assignedCount = cards.length - hand.length;
  const selectedCount = selectedIds.length;

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
    setSelectedIds([]);
    setNotice(`已將選取的牌退回手牌。`);
  }

  function confirmLayout() {
    if (!validation.valid) {
      setNotice(validation.errors[0] ?? "這副牌還不能提交。");
      return;
    }
    onLayoutConfirmed?.(lanes, cards);
    setNotice("這副牌成立，準備進入三墩比較。");
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
    <div className="section-heading lab-heading"><div><span className="card-kicker">十三支</span><h2 id="p0-lab-title">排好這副牌</h2></div><span className="progress-pill">{assignedCount}/13</span></div>
    <p className="lab-intro">先整理手牌，再一次選 3 張或 5 張放入對應墩位。牌可以退回重排。</p>
    <div className="notice" role="status">{notice}</div>

    <div className="lanes" aria-label="十三支分墩區">
      <Lane lane="back" cards={lanes.back} selectedIds={selectedSet} selectionOrder={selectionOrder} onSelect={(card) => toggleCard(card, "back")} />
      <Lane lane="middle" cards={lanes.middle} selectedIds={selectedSet} selectionOrder={selectionOrder} onSelect={(card) => toggleCard(card, "middle")} />
      <Lane lane="front" cards={lanes.front} selectedIds={selectedSet} selectionOrder={selectionOrder} onSelect={(card) => toggleCard(card, "front")} />
    </div>

    <div className="placement-actions" aria-label="批次分墩操作">
      <span className="action-label">{selectionMessage()}</span>
      {selectedZone === "hand" && <>
        <button type="button" className="lane-action action-front" disabled={selectedCount !== 3 || lanes.front.length > 0} onClick={() => placeSelected("front")}>放入頭墩</button>
        <button type="button" className="lane-action action-middle" disabled={selectedCount !== 5 || lanes.middle.length > 0} onClick={() => placeSelected("middle")}>放入中墩</button>
        <button type="button" className="lane-action action-back" disabled={selectedCount !== 5 || lanes.back.length > 0} onClick={() => placeSelected("back")}>放入尾墩</button>
      </>}
      {selectedZone !== "hand" && <button type="button" className="link-button" onClick={returnSelectedToHand}>退回手牌</button>}
      {selectedCount > 0 && <button type="button" className="link-button" onClick={() => setSelectedIds([])}>清除選取</button>}
    </div>

    <div className="hand-area"><div className="subsection-heading"><h3>手牌</h3><span>{hand.length} 張</span></div>
      <div className="sort-control" aria-label="手牌排序"><span>排序</span>{([ ["deal", "原始牌序"], ["rank", "點數"], ["suit-rank", "花色／點數"] ] as const).map(([mode, label]) => <button type="button" key={mode} className={sortMode === mode ? "is-active" : ""} aria-pressed={sortMode === mode} onClick={() => setSortMode(mode)}>{label}</button>)}</div>
      <div className="card-grid" aria-label="未配置手牌">{hand.map((card) => <PlayingCard key={card.id} card={card} selected={selectedSet.has(card.id)} selectionOrder={selectionOrder.get(card.id)} onClick={() => toggleCard(card, "hand")} />)}{hand.length === 0 && <p className="empty-hand">13 張牌都已分墩，檢查牌型順序後即可確認。</p>}</div>
    </div>

    <div className={`validation ${validation.valid ? "is-valid" : "is-invalid"}`}><strong>{validation.valid ? "合法分墩" : "尚未成立"}</strong>{!validation.valid && <span>{validation.errors[0] ?? "繼續配置 13 張牌。"}</span>}{validation.valid && <span>尾墩 ≥ 中墩 ≥ 頭墩，可以確認。</span>}</div>
    <button type="button" className="primary-button" disabled={!validation.valid} onClick={confirmLayout}>確認這副牌</button>
  </section>;
}