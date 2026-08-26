import { useMemo, useState } from "react";
import { drawThirteen, SUIT_LABELS, SUIT_SYMBOLS, type Suit } from "../domain/cards";
import { slotForChain, slotLabel, toggleGeneSlot } from "../domain/genes";
import { applySuitTemplate, buildSuitTemplate, normalizeGeneChain, type EquippedGenes, type GeneChain, type GeneSlot } from "../domain/template";
import { executeEffect } from "../domain/effects";
import type { RunState } from "../domain/run";
import { catalog } from "../content/catalog";

const GENE_SLOTS: GeneSlot[] = ["short3", "long5A", "long5B"];
const SUIT_CLASS: Record<Suit, string> = { water: "gene-water", fire: "gene-fire", wind: "gene-wind", earth: "gene-earth" };
const SLOT_HINTS: Record<GeneSlot, string> = { short3: "頭墩使用 3 格配置", long5A: "中墩使用 5 格配置", long5B: "尾墩使用 5 格配置" };

interface GeneWorkshopViewProps {
  initialInventory?: GeneChain[];
  initialEquipped?: EquippedGenes;
  onInventoryChange?: (inventory: GeneChain[]) => void;
  onEquippedChange?: (equipped: EquippedGenes) => void;
  onExit?: () => void;
  run?: RunState;
  partyCharacterIds?: string[];
  onRunUpdated?: (run: RunState) => void;
}

function chainPattern(chain: GeneChain): string {
  const normalized = normalizeGeneChain(chain);
  return normalized.factors.map((factor, index) => normalized.enabledSlots[index] ? SUIT_LABELS[factor.suit] : "無").join("");
}

function ChainChoice({ chain, selected, onClick }: { chain: GeneChain; selected: boolean; onClick: () => void }) {
  const normalized = normalizeGeneChain(chain);
  return <button type="button" className={`chain-choice${selected ? " is-selected" : ""}`} onClick={onClick} aria-pressed={selected}>
    <span className="chain-choice-heading"><strong>{normalized.name ?? "未命名基因鏈"}</strong><small>{selected ? "目前使用" : "點此切換"}</small></span>
    <span className="gene-pattern gene-pattern-compact" aria-label={`目前配置 ${chainPattern(normalized)}`}>
      {normalized.factors.map((factor, index) => <i className={`${SUIT_CLASS[factor.suit]}${normalized.enabledSlots[index] ? " is-enabled" : " is-disabled"}`} key={`${normalized.id}-${index}`} aria-hidden="true">{SUIT_SYMBOLS[factor.suit]}</i>)}
    </span>
    <small className="chain-choice-detail">{normalized.description ?? "固定元素排列，可自由開關每一格。"}</small>
  </button>;
}

function GenePatternEditor({ chain, onToggle }: { chain: GeneChain; onToggle: (index: number) => void }) {
  const normalized = normalizeGeneChain(chain);
  return <div className="gene-pattern-editor">
    <div className="gene-pattern-summary"><strong>目前配置：{chainPattern(normalized)}</strong><small>「無」代表保留該張牌原本花色</small></div>
    <div className="gene-pattern gene-pattern-interactive" role="group" aria-label={`${normalized.name ?? "基因鏈"}元素啟用設定`}>
      {normalized.factors.map((factor, index) => {
        const enabled = normalized.enabledSlots[index];
        return <button type="button" className={`${SUIT_CLASS[factor.suit]}${enabled ? " is-enabled" : " is-disabled"}`} key={`${normalized.id}-toggle-${index}`} aria-pressed={enabled} aria-label={`第 ${index + 1} 格 ${SUIT_LABELS[factor.suit]}元素${enabled ? "已啟用" : "未啟用"}`} onClick={() => onToggle(index)}><span>{SUIT_SYMBOLS[factor.suit]}</span><strong>{enabled ? SUIT_LABELS[factor.suit] : "無"}</strong><small>第 {index + 1} 格</small></button>;
      })}
    </div>
    <p className="gene-pattern-help">點選格子即可開關；啟用時覆寫花色，關閉時回到原始牌面。</p>
  </div>;
}

export default function GeneWorkshopView({ initialInventory, initialEquipped, onInventoryChange, onEquippedChange, onExit, run, partyCharacterIds = [], onRunUpdated }: GeneWorkshopViewProps = {}) {
  const starterInventory = initialInventory === undefined ? catalog.geneChains : initialInventory;
  const equippedChains = initialEquipped ? Object.values(initialEquipped).filter((chain): chain is GeneChain => Boolean(chain)) : [];
  const initialInventoryWithEquipped = [...starterInventory, ...equippedChains.filter((equippedChain) => !starterInventory.some((chain) => chain.id === equippedChain.id))].map((chain) => normalizeGeneChain(chain));
  const [inventory, setInventory] = useState(initialInventoryWithEquipped);
  const [equipped, setEquipped] = useState<EquippedGenes>(() => {
    const next: EquippedGenes = {};
    GENE_SLOTS.forEach((slot) => {
      const initial = initialEquipped?.[slot];
      next[slot] = initial ? normalizeGeneChain(initial) : inventory.find((chain) => slotForChain(chain) === slot);
    });
    return next;
  });
  const [notice, setNotice] = useState("每條基因鏈都是固定配置；先選擇墩位，再點格子開關。");
  const [forgeUsed, setForgeUsed] = useState(false);
  const sampleCards = useMemo(() => drawThirteen("workshop-preview"), []);
  const convertedCards = useMemo(() => applySuitTemplate(sampleCards, buildSuitTemplate(equipped)), [equipped, sampleCards]);
  const hasForgeAbility = partyCharacterIds.some((characterId) => catalog.characters.find((character) => character.id === characterId)?.activeAbilityId === "ability-forge");

  function notifyEquipped(nextEquipped: EquippedGenes) {
    setEquipped(nextEquipped);
    onEquippedChange?.(nextEquipped);
  }

  function selectChain(slot: GeneSlot, chain: GeneChain) {
    const nextEquipped = { ...equipped, [slot]: normalizeGeneChain(chain) };
    notifyEquipped(nextEquipped);
    setNotice(`${chain.name ?? "這條基因鏈"} 已套用到${slotLabel(slot)}。`);
  }

  function toggleSlot(slot: GeneSlot, index: number) {
    const current = equipped[slot];
    if (!current) return;
    const nextChain = toggleGeneSlot(current, index);
    const nextInventory = inventory.map((chain) => chain.id === nextChain.id ? nextChain : chain);
    const nextEquipped = { ...equipped, [slot]: nextChain };
    setInventory(nextInventory);
    onInventoryChange?.(nextInventory);
    notifyEquipped(nextEquipped);
    setNotice(`${slotLabel(slot)}第 ${index + 1} 格已${nextChain.enabledSlots[index] ? "啟用" : "關閉"}。`);
  }

  function clearSlot(slot: GeneSlot) {
    const nextEquipped = { ...equipped, [slot]: undefined };
    notifyEquipped(nextEquipped);
    setNotice(`${slotLabel(slot)}暫時不使用基因鏈，會保留原始牌面。`);
  }

  function useForgeAbility() {
    if (!run || forgeUsed || run.discoveredRunFlags.includes("effect:ability-forge")) return;
    const sourceId = partyCharacterIds.find((characterId) => catalog.characters.find((character) => character.id === characterId)?.activeAbilityId === "ability-forge") ?? "ability-forge";
    const effectResult = executeEffect("ability-forge", { phase: "gene-config", run, sourceId });
    if (!effectResult.applied) return;
    const nextEquipped = Object.fromEntries(GENE_SLOTS.map((slot) => {
      const chain = equipped[slot];
      return [slot, chain ? { ...chain, enabledSlots: chain.factors.map(() => true) } : undefined];
    })) as EquippedGenes;
    const nextInventory = inventory.map((chain) => nextEquipped[slotForChain(chain)]?.id === chain.id ? nextEquipped[slotForChain(chain)]! : chain);
    setForgeUsed(true);
    setInventory(nextInventory);
    onInventoryChange?.(nextInventory);
    notifyEquipped(nextEquipped);
    setNotice("鍛造師已將目前裝備的基因格全部啟用。");
    onRunUpdated?.(effectResult.run);
  }

  return <div className="workshop-view"><div className="screen-title-row"><div><span className="pixel-kicker">GENE PATTERNS · P2</span><h1>基因鏈配置</h1></div><div className="title-actions"><span className="rank-badge">固定配置</span>{onExit && <button type="button" className="link-button" onClick={onExit}>回到路線</button>}</div></div>
    <div className="workshop-notice" role="status"><span className="event-mark">!</span><span>{notice}</span></div>
    <p className="gene-intro">基因鏈掉落時就已決定作用墩位與元素順序。你不用合成或升階，只要選一條鏈，再點選想啟用的元素格。</p>
    {hasForgeAbility && <button type="button" className="ability-button" onClick={useForgeAbility} disabled={forgeUsed || run?.discoveredRunFlags.includes("effect:ability-forge")}>鍛造師・全部啟用{forgeUsed || run?.discoveredRunFlags.includes("effect:ability-forge") ? "・已用" : ""}</button>}
    {GENE_SLOTS.map((slot) => {
      const candidates = inventory.filter((chain) => slotForChain(chain) === slot);
      const selected = equipped[slot];
      return <section className="workshop-card gene-lane-card" key={slot} aria-labelledby={`gene-lane-${slot}`}>
        <div className="workshop-card-heading"><div><span className="pixel-kicker">{slot === "short3" ? "FRONT" : slot === "long5A" ? "MIDDLE" : "BACK"}</span><h2 id={`gene-lane-${slot}`}>{slotLabel(slot)}</h2></div><span className="muted-light">{candidates.length} 條可選</span></div>
        <p className="gene-lane-hint">{SLOT_HINTS[slot]}；同一墩同時只使用一條，其他是替換候選。</p>
        {candidates.length > 0 ? <div className="gene-choice-list" role="group" aria-label={`${slotLabel(slot)}候選基因鏈`}>{candidates.map((chain) => <ChainChoice key={chain.id} chain={chain} selected={selected?.id === chain.id} onClick={() => selectChain(slot, chain)} />)}</div> : <p className="empty-workshop">目前沒有適合這個墩位的基因鏈。</p>}
        {selected ? <><GenePatternEditor chain={selected} onToggle={(index) => toggleSlot(slot, index)} /><button type="button" className="link-button gene-clear-button" onClick={() => clearSlot(slot)}>清除這個墩位的基因</button></> : <p className="gene-empty-selected">未啟用基因鏈，這個墩位保留原始牌面。</p>}
      </section>;
    })}
    <section className="workshop-card converted-preview"><div className="workshop-card-heading"><div><span className="pixel-kicker">CURRENT SUIT PREVIEW</span><h2>13 張牌花色預覽</h2></div><span className="muted-light">未啟用格保留原色</span></div><div className="preview-cards">{convertedCards.map((card) => <span className={`preview-card ${SUIT_CLASS[card.currentSuit]}`} key={card.id}><strong>{SUIT_SYMBOLS[card.currentSuit]}</strong><small>{card.originalSuit === card.currentSuit ? "原色" : `${SUIT_LABELS[card.originalSuit]}→${SUIT_LABELS[card.currentSuit]}`}</small></span>)}</div></section>
  </div>;
}
