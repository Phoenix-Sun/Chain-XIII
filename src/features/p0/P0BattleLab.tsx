import { useMemo, useState } from "react";
import { drawThirteen, rankLabel, SUIT_LABELS, SUIT_SYMBOLS, type Card } from "../../domain/cards";
import { emptyLanes, LANE_LABELS, LANE_SIZES, validateLayout, type LaneId, type Lanes } from "../../domain/layout";
import { evaluateHand } from "../../domain/hands";

const DEFAULT_SEED = "CHAIN-XIII-P0-001";
export interface P0BattleLabProps { onLayoutConfirmed?: (layout: Lanes, cards: Card[]) => void; }

function PlayingCard({ card, selected, onClick }: { card: Card; selected: boolean; onClick: () => void }) {
  return <button type="button" className={`playing-card suit-${card.suit}${selected ? " is-selected" : ""}`} aria-label={`${SUIT_LABELS[card.suit]} ${rankLabel(card.rank)}`} aria-pressed={selected} onClick={onClick}><span className="playing-card-rank">{rankLabel(card.rank)}</span><span className="playing-card-suit" aria-hidden="true">{SUIT_SYMBOLS[card.suit]}</span><span className="playing-card-name">{SUIT_LABELS[card.suit]}</span></button>;
}

function Lane({ lane, cards, selectedId, onSelect }: { lane: LaneId; cards: Card[]; selectedId: string | null; onSelect: (card: Card) => void }) {
  const expected = LANE_SIZES[lane];
  const rank = cards.length === expected ? evaluateHand(cards) : null;
  return <section className={`lane lane-${lane}`} aria-labelledby={`${lane}-lane-title`}><div className="lane-heading"><div><span className="lane-label" id={`${lane}-lane-title`}>{LANE_LABELS[lane]}</span><span className="lane-size">{cards.length}/{expected}</span></div><span className="lane-hint">{rank?.label ?? "待配置"}</span></div><div className="lane-cards">{cards.length === 0 && <span className="lane-empty">點選手牌後放入這裡</span>}{cards.map((card) => <PlayingCard key={card.id} card={card} selected={card.id === selectedId} onClick={() => onSelect(card)} />)}</div></section>;
}

export default function P0BattleLab({ onLayoutConfirmed }: P0BattleLabProps = {}) {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [cards, setCards] = useState(() => drawThirteen(DEFAULT_SEED));
  const [lanes, setLanes] = useState<Lanes>(() => emptyLanes());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("先點一張牌，再選擇它要放入頭墩、中墩或尾墩。");
  const assignedIds = useMemo(() => new Set([...lanes.front, ...lanes.middle, ...lanes.back].map((card) => card.id)), [lanes]);
  const hand = cards.filter((card) => !assignedIds.has(card.id));
  const selectedCard = cards.find((card) => card.id === selectedId) ?? null;
  const validation = useMemo(() => validateLayout(lanes), [lanes]);
  const assignedCount = cards.length - hand.length;

  function dealNewHand() {
    const nextSeed = seed.trim() || DEFAULT_SEED;
    setSeed(nextSeed); setCards(drawThirteen(nextSeed)); setLanes(emptyLanes()); setSelectedId(null); setNotice(`已用 seed「${nextSeed}」重新抽出 13 張牌。`);
  }
  function placeSelected(lane: LaneId) {
    if (!selectedCard) { setNotice("請先點選一張牌。"); return; }
    let moved = false;
    setLanes((current) => {
      const next: Lanes = { front: current.front.filter((card) => card.id !== selectedCard.id), middle: current.middle.filter((card) => card.id !== selectedCard.id), back: current.back.filter((card) => card.id !== selectedCard.id) };
      if (next[lane].length >= LANE_SIZES[lane]) return current;
      next[lane] = [...next[lane], selectedCard]; moved = true; return next;
    });
    if (moved) { setSelectedId(null); setNotice(`${rankLabel(selectedCard.rank)}${SUIT_LABELS[selectedCard.suit]} 已放入${LANE_LABELS[lane]}。`); } else setNotice(`${LANE_LABELS[lane]}已滿，請先移走一張牌。`);
  }
  function returnSelectedToHand() {
    if (!selectedCard) return;
    setLanes((current) => ({ front: current.front.filter((card) => card.id !== selectedCard.id), middle: current.middle.filter((card) => card.id !== selectedCard.id), back: current.back.filter((card) => card.id !== selectedCard.id) }));
    setNotice(`${rankLabel(selectedCard.rank)}${SUIT_LABELS[selectedCard.suit]} 已回到手牌。`); setSelectedId(null);
  }
  function confirmLayout() {
    if (!validation.valid) { setNotice(validation.errors[0] ?? "這副牌還不能提交。"); return; }
    onLayoutConfirmed?.(lanes, cards);
    setNotice("P0 牌局成立：3/5/5 合法，已送入敵我三墩比較。");
  }

  return <section className="card lab-card" aria-labelledby="p0-lab-title"><div className="section-heading lab-heading"><div><span className="card-kicker">P0 playable slice</span><h2 id="p0-lab-title">十三支分墩實驗台</h2></div><span className="progress-pill">{assignedCount}/13 已配置</span></div><p className="lab-intro">手機先用點選操作驗證核心決策：固定 seed 抽牌，將 13 張牌排成頭 3、中 5、尾 5。</p><div className="seed-control"><label htmlFor="p0-seed">Run seed</label><div className="seed-input-row"><input id="p0-seed" value={seed} onChange={(event) => setSeed(event.target.value)} onKeyDown={(event) => event.key === "Enter" && dealNewHand()} /><button type="button" className="secondary-button" onClick={dealNewHand}>重新抽牌</button></div></div><div className="notice" role="status">{notice}</div><div className="hand-area"><div className="subsection-heading"><h3>手牌</h3><span>{hand.length} 張未配置</span></div><div className="card-grid" aria-label="未配置手牌">{hand.map((card) => <PlayingCard key={card.id} card={card} selected={card.id === selectedId} onClick={() => setSelectedId(card.id)} />)}{hand.length === 0 && <p className="empty-hand">13 張牌都已分墩，接著檢查牌型順序。</p>}</div></div><div className="placement-actions" aria-label="放置選取的牌"><span className="action-label">{selectedCard ? `已選：${rankLabel(selectedCard.rank)}${SUIT_LABELS[selectedCard.suit]}` : "選牌後放入"}</span><button type="button" className="lane-action action-front" disabled={!selectedCard} onClick={() => placeSelected("front")}>頭墩 3</button><button type="button" className="lane-action action-middle" disabled={!selectedCard} onClick={() => placeSelected("middle")}>中墩 5</button><button type="button" className="lane-action action-back" disabled={!selectedCard} onClick={() => placeSelected("back")}>尾墩 5</button><button type="button" className="link-button" disabled={!selectedCard || !assignedIds.has(selectedId ?? "")} onClick={returnSelectedToHand}>退回手牌</button></div><div className="lanes" aria-label="十三支分墩區"><Lane lane="back" cards={lanes.back} selectedId={selectedId} onSelect={setSelectedId ? (card) => setSelectedId(card.id) : () => undefined} /><Lane lane="middle" cards={lanes.middle} selectedId={selectedId} onSelect={(card) => setSelectedId(card.id)} /><Lane lane="front" cards={lanes.front} selectedId={selectedId} onSelect={(card) => setSelectedId(card.id)} /></div><div className={`validation ${validation.valid ? "is-valid" : "is-invalid"}`}><strong>{validation.valid ? "合法分墩" : "尚未成立"}</strong>{!validation.valid && <span>{validation.errors[0] ?? "繼續配置 13 張牌。"}</span>}{validation.valid && <span>尾墩 ≥ 中墩 ≥ 頭墩，可以提交。</span>}</div><button type="button" className="primary-button" disabled={!validation.valid} onClick={confirmLayout}>確認這副牌</button></section>;
}
