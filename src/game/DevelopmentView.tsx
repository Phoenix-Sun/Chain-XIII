const milestones = [
  { label: "牌組與規則核心", value: 100, state: "已完成" },
  { label: "花色模板", value: 20, state: "建置中" },
  { label: "基因鍊成", value: 0, state: "未開始" },
  { label: "可玩戰鬥", value: 10, state: "下一站" },
];

export default function DevelopmentView() {
  return (
    <div className="development-view">
      <div className="screen-title-row"><div><span className="pixel-kicker">ARCHIVE · DEV LOG</span><h1>城鎮開發卷宗</h1></div><span className="rank-badge">Build 0.1</span></div>
      <section className="archive-card">
        <div className="archive-card-heading"><div><span className="pixel-kicker">目前章節</span><h2>P0・十三支初陣</h2></div><span className="archive-stamp">PLAYABLE</span></div>
        <p>先把規則做成可以玩的核心，再讓花色、鍊成與事件逐層長到地圖上。</p>
        <div className="milestone-list">
          {milestones.map((milestone) => (
            <div className="milestone" key={milestone.label}><div className="milestone-label"><span>{milestone.label}</span><small>{milestone.state}</small></div><div className="milestone-track"><i style={{ width: `${milestone.value}%` }} /></div></div>
          ))}
        </div>
      </section>
      <section className="system-card"><div><span className="pixel-kicker">系統狀態</span><h2>Worker + D1</h2><p>保留雲端存檔接點，先以 local-first 的遊戲狀態驅動介面。</p></div><code>GET /api/health</code></section>
      <section className="design-notes"><span className="pixel-kicker">設計準則</span><div className="note-grid"><span>01 固定 HUD</span><span>02 短訊息回饋</span><span>03 點擊即有反應</span><span>04 數值持續成長</span></div></section>
    </div>
  );
}
