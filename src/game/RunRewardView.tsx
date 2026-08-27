import { useState } from "react";
import type { RewardChoice, RunReward } from "../domain/runRewards";
import { rewardMultiplierForDifficulty } from "../domain/runRewards";
import { RUN_DIFFICULTIES, type RunDifficulty } from "../domain/run";
import type { RunMapNode } from "../domain/map";
import { catalog } from "../content/catalog";
import { SUIT_LABELS, SUIT_SYMBOLS } from "../domain/cards";
import { slotLabel } from "../domain/genes";
import { normalizeGeneChain } from "../domain/template";

function readableGeneName(id: string): string {
  return catalog.geneChains.find((chain) => chain.id === id)?.name ?? id.replace(/^gene-/, "").split("-").map((part) => ({ water: "水", fire: "火", wind: "風", earth: "地" }[part] ?? part)).join("／");
}

function readableRelicName(id: string): string {
  return catalog.relics.find((relic) => relic.id === id)?.name ?? id.replace(/^relic-/, "遺物 ");
}

export default function RunRewardView({ node, difficulty = "normal", isFinalBoss = false, reward, inventoryCount, geneCapacity, error, initialChoiceId, onChoiceChange, onClaim, onSkipGene }: { node: RunMapNode; difficulty?: RunDifficulty; isFinalBoss?: boolean; reward: RunReward; inventoryCount: number; geneCapacity: number; error?: string | null; initialChoiceId?: string; onChoiceChange?: (choiceId: string) => void; onClaim: (choice?: RewardChoice) => void; onSkipGene?: () => void }) {
  const [selectedChoiceId, setSelectedChoiceId] = useState(initialChoiceId ?? reward.choices?.[0]?.id);
  const selectedChoice = reward.choices?.find((choice) => choice.id === selectedChoiceId);
  const selectedGene = selectedChoice?.geneChain ?? reward.geneChain;
  const inventoryFull = Boolean(selectedGene && inventoryCount >= geneCapacity);
  const normalizedGene = selectedGene ? normalizeGeneChain(selectedGene) : undefined;
  return <section className="run-reward-card" aria-labelledby="run-reward-title">

    <h1 id="run-reward-title">{reward.title}</h1>
    <p>{reward.detail}</p>
    <div className="reward-source">{node.type === "boss" ? "Boss 已擊敗" : node.type === "elite" ? "菁英已擊敗" : "目前節點已完成"}</div>
    <div className="reward-difficulty" aria-label="難度獎勵倍率"><span>{RUN_DIFFICULTIES[difficulty].label}難度</span><strong>水晶獎勵 ×{rewardMultiplierForDifficulty(difficulty)}</strong><small>高風險難度會給予更高的水晶回報。</small></div>
    <div className="reward-list">
      <div className="reward-item"><strong>+{reward.crystals}</strong><span>水晶</span></div>
      {reward.geneChainId && <div className="reward-item"><strong>基因鏈</strong><span>{readableGeneName(reward.geneChainId)}</span></div>}
      {reward.relicId && <div className="reward-item"><strong>遺物</strong><span>{readableRelicName(reward.relicId)}</span><small>{catalog.relics.find((relic) => relic.id === reward.relicId)?.effect ?? "效果待確認"}</small></div>}
    </div>
    {reward.choices && <div className="reward-choices" role="radiogroup" aria-label="事件獎勵選擇">
      <strong>選一項帶走</strong>
      {reward.choices.map((choice) => <label className={`reward-choice${selectedChoiceId === choice.id ? " is-selected" : ""}`} key={choice.id}>
        <input type="radio" name="event-reward" value={choice.id} checked={selectedChoiceId === choice.id} onChange={() => { setSelectedChoiceId(choice.id); onChoiceChange?.(choice.id); }} />
        <span><b>{choice.label}</b><small>{choice.geneChainId ? readableGeneName(choice.geneChainId) : choice.relicId ? readableRelicName(choice.relicId) : choice.id}</small>{choice.relicId && <small>{catalog.relics.find((relic) => relic.id === choice.relicId)?.effect}</small>}<em>{choice.detail}</em></span>
      </label>)}
    </div>}
    {normalizedGene && <div className="reward-gene-preview"><div><strong>{normalizedGene.name ?? readableGeneName(normalizedGene.id)}</strong><small>{slotLabel(normalizedGene.targetSlot)}・固定配置</small></div><div className="gene-pattern gene-pattern-compact" aria-label={`基因鏈固定配置 ${normalizedGene.factors.map((factor, index) => normalizedGene.enabledSlots[index] ? SUIT_LABELS[factor.suit] : "無").join("")}`}>{normalizedGene.factors.map((factor, index) => <i className={`gene-${factor.suit}${normalizedGene.enabledSlots[index] ? " is-enabled" : " is-disabled"}`} key={`reward-gene-${index}`}>{SUIT_SYMBOLS[factor.suit]}</i>)}</div><small>到配置畫面後可自由開關每一格；未啟用時保留原始牌面花色。</small></div>}
    {selectedGene && <p className={`reward-capacity${inventoryFull ? " is-full" : ""}`}>基因庫：{inventoryCount} / {geneCapacity}{inventoryFull ? "，已滿；可以放棄這條鏈，只保留水晶。" : ""}</p>}
    {error && <p className="reward-error" role="alert">{error}</p>}
    <div className="reward-actions"><button type="button" className="primary-button" disabled={inventoryFull || Boolean(reward.choices && !selectedChoice)} onClick={() => onClaim(selectedChoice)}>{isFinalBoss ? "領取並結算" : "領取獎勵"}</button>{inventoryFull && onSkipGene && <button type="button" className="link-button" onClick={onSkipGene}>只拿水晶，放棄基因鏈</button>}</div>
  </section>;
}
