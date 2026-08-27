import { RUN_DIFFICULTIES, type RunState } from "../domain/run";

export default function RunSettlementView({ run, onExit }: { run: RunState; onExit: () => void }) {
  const won = run.status === "won";
  const abandoned = run.endReason === "abandoned";
  const imprintCount = won ? run.partyCharacterIds.length : 0;
  const earnedCrystals = Math.max(0, run.earnedCrystals - Math.max(0, run.startingCrystals ?? 0));
  const failedNode = run.map.nodes.find((node) => node.id === run.currentNodeId);
  const failureReason = failedNode?.type === "boss" ? "Boss 戰敗會直接清空命數。" : failedNode?.type === "elite" ? "菁英戰敗會扣除 2 點命數。" : "普通戰鬥戰敗會扣除 1 點命數。";
  return <section className={`run-settlement-card ${won ? "is-won" : "is-lost"}`} aria-labelledby="run-settlement-title">
    <h1 id="run-settlement-title">{won ? "這趟遠征完成" : "這趟遠征結束"}</h1>
    <p>{won ? "你打倒了第三章 Boss，帶著這趟三章遠征的收穫回到營地。" : abandoned ? "你主動放棄了這趟遠征；尚未領取的本趟獎勵不會加入永久收藏，已累積的永久獎勵仍會保留。" : run.livesRemaining === 0 ? `十三支戰敗耗盡了這趟遠征的命，已累積的永久獎勵仍會保留。${failureReason}` : `這次沒有走到終點，但已經累積的永久獎勵仍會保留。${failureReason}`}</p>
    <div className="settlement-stats">
      <div><strong>{RUN_DIFFICULTIES[run.difficulty].label}</strong><span>本趟難度</span></div>
      <div><strong>{run.livesRemaining}/{run.maxLives}</strong><span>剩餘命</span></div>
      <div><strong>{earnedCrystals}</strong><span>本趟取得水晶</span></div>
      <div><strong>+{imprintCount}</strong><span>角色印記</span></div>
      <div><strong>{run.earnedGeneChainIds.length}</strong><span>取得基因鏈</span></div>
      <div><strong>{run.completedNodeIds.length}/{run.map.chapterLengths.reduce((total, length) => total + length, 0)}</strong><span>完成節點</span></div>
    </div>
    <button type="button" className="primary-button" onClick={onExit}>回到營地</button>
  </section>;
}
