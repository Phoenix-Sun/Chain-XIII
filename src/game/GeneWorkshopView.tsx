import { useMemo, useState } from "react";
import { drawThirteen, SUIT_LABELS, type Suit } from "../domain/cards";
import { canEquip, commitFusion, previewFusion } from "../domain/genes";
import { applySuitTemplate, buildSuitTemplate, type EquippedGenes, type GeneChain } from "../domain/template";

const STARTING_CHAINS: GeneChain[] = [
  { id: "chain-water-wind", sourceMonsterId: "monster-water", factors: [{ suit: "water", tier: 1 }, { suit: "fire", tier: 1 }, { suit: "wind", tier: 1 }] },
  { id: "chain-earth-fire", sourceMonsterId: "monster-earth", factors: [{ suit: "wind", tier: 1 }, { suit: "earth", tier: 1 }, { suit: "water", tier: 1 }, { suit: "fire", tier: 1 }, { suit: "earth", tier: 1 }] },
  { id: "chain-fire-water", sourceMonsterId: "monster-fire", factors: [{ suit: "fire", tier: 1 }, { suit: "wind", tier: 1 }, { suit: "earth", tier: 1 }, { suit: "water", tier: 1 }, { suit: "fire", tier: 1 }] },
];
const SUIT_CLASS: Record<Suit, string> = { water: "gene-water", fire: "gene-fire", wind: "gene-wind", earth: "gene-earth" };
const SLOT_LABELS = { short3: "頭墩・3 格", long5A: "中墩・5 格 A", long5B: "尾墩・5 格 B" } as const;

function ChainStrip({ chain, selected, onClick }: { chain: GeneChain; selected: boolean; onClick: () => void }) {
  return <button type="button" className={`chain-strip${selected ? " is-selected" : ""}`} onClick={onClick} aria-pressed={selected}><span className="chain-id">{chain.id}</span><span className="factor-row">{chain.factors.map((factor, index) => <i className={SUIT_CLASS[factor.suit]} key={`${chain.id}-${index}`} title={`${SUIT_LABELS[factor.suit]} ${factor.tier}階`}>{factor.suit.slice(0, 1).toUpperCase()}<small>{factor.tier}</small></i>)}</span><small>{chain.factors.length} 格 · {chain.sourceMonsterId ?? "未知來源"}</small></button>;
}

export default function GeneWorkshopView() {
  const [inventory, setInventory] = useState(STARTING_CHAINS);
  const [leftId, setLeftId] = useState(STARTING_CHAINS[0].id);
  const [rightId, setRightId] = useState(STARTING_CHAINS[1].id);
  const [equipped, setEquipped] = useState<EquippedGenes>({ short3: STARTING_CHAINS[0], long5A: STARTING_CHAINS[1] });
  const [notice, setNotice] = useState("選兩條基因鏈，先看預覽，再決定是否不可逆合成。");
  const left = inventory.find((chain) => chain.id === leftId) ?? inventory[0];
  const right = inventory.find((chain) => chain.id === rightId) ?? inventory[1] ?? inventory[0];
  const fusion = useMemo(() => left && right && left.id !== right.id ? previewFusion(left, right, 5) : null, [left, right]);
  const sampleCards = useMemo(() => drawThirteen("workshop-preview"), []);
  const convertedCards = useMemo(() => applySuitTemplate(sampleCards, buildSuitTemplate(equipped)), [equipped, sampleCards]);

  function commit() {
    if (!fusion) return;
    const result = commitFusion(fusion);
    setInventory((current) => [...current.filter((chain) => chain.id !== left.id && chain.id !== right.id), result]);
    setLeftId(result.id);
    setRightId(STARTING_CHAINS[0].id);
    setNotice(`已合成 ${result.id}。原鏈已消耗，這個結果無法復原。`);
  }

  function equip(chain: GeneChain, slot: keyof EquippedGenes) {
    if (!canEquip(chain, slot)) { setNotice(`${SLOT_LABELS[slot]}不能裝備 ${chain.factors.length} 格鏈。`); return; }
    setEquipped((current) => ({ ...current, [slot]: chain }));
    setNotice(`${chain.id} 已裝入${SLOT_LABELS[slot]}。`);
  }

  return <div className="workshop-view"><div className="screen-title-row"><div><span className="pixel-kicker">GENE FORGE · P2</span><h1>花色鍊成工房</h1></div><span className="rank-badge">不可逆</span></div>
    <div className="workshop-notice"><span className="event-mark">!</span><span>{notice}</span></div>
    <section className="workshop-card"><div className="workshop-card-heading"><div><span className="pixel-kicker">RUN INVENTORY</span><h2>基因庫・{inventory.length} / 6</h2></div><span className="muted-light">同接點會升階</span></div><div className="chain-inventory">{inventory.map((chain) => <ChainStrip key={chain.id} chain={chain} selected={chain.id === leftId || chain.id === rightId} onClick={() => chain.id === leftId ? setLeftId(chain.id) : setRightId(chain.id)} />)}</div></section>
    <section className="workshop-card fusion-card"><div className="workshop-card-heading"><div><span className="pixel-kicker">FUSION PREVIEW</span><h2>接合預覽</h2></div><span className="fusion-arrow">A ＋ B →</span></div><div className="fusion-columns"><div><small>左鏈 A</small><ChainStrip chain={left} selected={false} onClick={() => undefined} /></div><div><small>右鏈 B</small><ChainStrip chain={right} selected={false} onClick={() => undefined} /></div></div>{fusion ? <div className="fusion-result"><span className="result-label">{fusion.joined === "fused" ? "同元素融合升階" : "異元素直接串接"} · 前端擠出 {fusion.removedFromFront} 格</span><div className="factor-row large">{fusion.factors.map((factor, index) => <i className={SUIT_CLASS[factor.suit]} key={`preview-${index}`}>{factor.suit.slice(0, 1).toUpperCase()}<small>{factor.tier}</small></i>)}</div><button type="button" className="pixel-button gold-button" onClick={commit}>確認鍊成</button></div> : <p className="empty-workshop">選擇不同的兩條鏈以預覽。</p>}</section>
    <section className="workshop-card"><div className="workshop-card-heading"><div><span className="pixel-kicker">EQUIPMENT · 3 / 5 / 5</span><h2>戰前裝備槽</h2></div><span className="muted-light">免費換裝</span></div><div className="equipment-slots">{(Object.keys(SLOT_LABELS) as Array<keyof EquippedGenes>).map((slot) => <div className="equipment-slot" key={slot}><div><span>{SLOT_LABELS[slot]}</span><small>{equipped[slot]?.id ?? "未裝備，保留原花色"}</small></div><div className="slot-actions">{inventory.map((chain) => <button type="button" key={`${slot}-${chain.id}`} disabled={!canEquip(chain, slot)} onClick={() => equip(chain, slot)}>{chain.factors.length}格</button>)}</div></div>)}</div><div className="converted-preview"><span className="pixel-kicker">CURRENT SUIT PREVIEW</span><div className="preview-cards">{convertedCards.map((card) => <span className={`preview-card ${SUIT_CLASS[card.currentSuit]}`} key={card.id}><strong>{card.currentSuit.slice(0, 1).toUpperCase()}</strong><small>{card.originalSuit.slice(0, 1).toUpperCase()}→{card.currentSuit.slice(0, 1).toUpperCase()}</small></span>)}</div></div></section>
  </div>;
}
