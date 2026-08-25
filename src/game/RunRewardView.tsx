import type { RunReward } from "../domain/runRewards";
import type { RunMapNode } from "../domain/map";

function readableGeneName(id: string): string {
  return id.replace(/^gene-/, "").split("-").map((part) => ({ water: "水", fire: "火", wind: "風", earth: "地" }[part] ?? part)).join("／");
}

function readableRelicName(id: string): string {
  return id.replace(/^relic-/, "遺物 ");
}

export default function RunRewardView({ node, reward, inventoryCount, geneCapacity, error, onClaim, onSkipGene }: { node: RunMapNode; reward: RunReward; inventoryCount: number; geneCapacity: number; error?: string | null; onClaim: () => void; onSkipGene?: () => void }) {
  const inventoryFull = Boolean(reward.geneChain && inventoryCount >= geneCapacity);
  return <section className="run-reward-card" aria-labelledby="run-reward-title">
    <span className="pixel-kicker">節點完成</span>
    <h1 id="run-reward-title">{reward.title}</h1>
    <p>{reward.detail}</p>
    <div className="reward-source">{node.type === "boss" ? "Boss 已擊敗" : "目前節點已完成"}</div>
    <div className="reward-list">
      <div className="reward-item"><strong>+{reward.crystals}</strong><span>水晶</span></div>
      {reward.geneChainId && <div className="reward-item"><strong>基因鏈</strong><span>{readableGeneName(reward.geneChainId)}</span></div>}
      {reward.relicId && <div className="reward-item"><strong>遺物</strong><span>{readableRelicName(reward.relicId)}</span></div>}
    </div>
    {reward.geneChain && <p className={`reward-capacity${inventoryFull ? " is-full" : ""}`}>基因庫：{inventoryCount} / {geneCapacity}{inventoryFull ? "，已滿；可以放棄這條鏈，只保留水晶。" : ""}</p>}
    {error && <p className="reward-error" role="alert">{error}</p>}
    <div className="reward-actions"><button type="button" className="primary-button" disabled={inventoryFull} onClick={onClaim}>{node.type === "boss" ? "領取並結算" : "領取獎勵"}</button>{inventoryFull && onSkipGene && <button type="button" className="link-button" onClick={onSkipGene}>只拿水晶，放棄基因鏈</button>}</div>
  </section>;
}
