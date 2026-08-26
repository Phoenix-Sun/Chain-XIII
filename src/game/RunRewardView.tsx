import { useState } from "react";
import type { RewardChoice, RunReward } from "../domain/runRewards";
import { rewardMultiplierForDifficulty } from "../domain/runRewards";
import { RUN_DIFFICULTIES, type RunDifficulty } from "../domain/run";
import type { RunMapNode } from "../domain/map";
import { catalog } from "../content/catalog";

function readableGeneName(id: string): string {
  return id.replace(/^gene-/, "").split("-").map((part) => ({ water: "水", fire: "火", wind: "風", earth: "地" }[part] ?? part)).join("／");
}

function readableRelicName(id: string): string {
  return catalog.relics.find((relic) => relic.id === id)?.name ?? id.replace(/^relic-/, "遺物 ");
}

export default function RunRewardView({ node, difficulty = "normal", reward, inventoryCount, geneCapacity, error, onClaim, onSkipGene }: { node: RunMapNode; difficulty?: RunDifficulty; reward: RunReward; inventoryCount: number; geneCapacity: number; error?: string | null; onClaim: (choice?: RewardChoice) => void; onSkipGene?: () => void }) {
  const [selectedChoiceId, setSelectedChoiceId] = useState(reward.choices?.[0]?.id);
  const selectedChoice = reward.choices?.find((choice) => choice.id === selectedChoiceId);
  const selectedGene = selectedChoice?.geneChain ?? reward.geneChain;
  const inventoryFull = Boolean(selectedGene && inventoryCount >= geneCapacity);
  return <section className="run-reward-card" aria-labelledby="run-reward-title">
    <span className="pixel-kicker">節點完成</span>
    <h1 id="run-reward-title">{reward.title}</h1>
    <p>{reward.detail}</p>
    <div className="reward-source">{node.type === "boss" ? "Boss 已擊敗" : "目前節點已完成"}</div>
    <div className="reward-difficulty" aria-label="難度獎勵倍率"><span>{RUN_DIFFICULTIES[difficulty].label}難度</span><strong>水晶獎勵 ×{rewardMultiplierForDifficulty(difficulty)}</strong><small>高風險難度會給予更高的水晶回報。</small></div>
    <div className="reward-list">
      <div className="reward-item"><strong>+{reward.crystals}</strong><span>水晶</span></div>
      {reward.geneChainId && <div className="reward-item"><strong>基因鏈</strong><span>{readableGeneName(reward.geneChainId)}</span></div>}
      {reward.relicId && <div className="reward-item"><strong>遺物</strong><span>{readableRelicName(reward.relicId)}</span></div>}
    </div>
    {reward.choices && <div className="reward-choices" role="radiogroup" aria-label="事件獎勵選擇">
      <strong>選一項帶走</strong>
      {reward.choices.map((choice) => <label className={`reward-choice${selectedChoiceId === choice.id ? " is-selected" : ""}`} key={choice.id}>
        <input type="radio" name="event-reward" value={choice.id} checked={selectedChoiceId === choice.id} onChange={() => setSelectedChoiceId(choice.id)} />
        <span><b>{choice.label}</b><small>{choice.geneChainId ? readableGeneName(choice.geneChainId) : choice.relicId ? readableRelicName(choice.relicId) : choice.id}</small><em>{choice.detail}</em></span>
      </label>)}
    </div>}
    {selectedGene && <p className={`reward-capacity${inventoryFull ? " is-full" : ""}`}>基因庫：{inventoryCount} / {geneCapacity}{inventoryFull ? "，已滿；可以放棄這條鏈，只保留水晶。" : ""}</p>}
    {error && <p className="reward-error" role="alert">{error}</p>}
    <div className="reward-actions"><button type="button" className="primary-button" disabled={inventoryFull || Boolean(reward.choices && !selectedChoice)} onClick={() => onClaim(selectedChoice)}>{node.type === "boss" ? "領取並結算" : "領取獎勵"}</button>{inventoryFull && onSkipGene && <button type="button" className="link-button" onClick={onSkipGene}>只拿水晶，放棄基因鏈</button>}</div>
  </section>;
}
