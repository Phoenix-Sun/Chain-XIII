import type { RunState } from "../domain/run";

export default function RunSettlementView({ run, onExit }: { run: RunState; onExit: () => void }) {
  const won = run.status === "won";
  return <section className={`run-settlement-card ${won ? "is-won" : "is-lost"}`} aria-labelledby="run-settlement-title">
    <span className="pixel-kicker">遠征結算</span>
    <h1 id="run-settlement-title">{won ? "這趟遠征完成" : "這趟遠征結束"}</h1>
    <p>{won ? "你打倒了 Boss，帶著這趟遠征的收穫回到營地。" : "這次沒有走到終點，但已經累積的永久獎勵仍會保留。"}</p>
    <div className="settlement-stats">
      <div><strong>{run.earnedCrystals}</strong><span>本趟取得水晶</span></div>
      <div><strong>{run.earnedGeneChainIds.length}</strong><span>取得基因鏈</span></div>
      <div><strong>{run.completedNodeIds.length}</strong><span>完成節點</span></div>
    </div>
    <button type="button" className="primary-button" onClick={onExit}>回到營地</button>
  </section>;
}
