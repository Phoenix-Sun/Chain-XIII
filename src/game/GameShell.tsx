import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { GameSpeed, GameView, ResourceAmount } from "./types";

const VIEW_ITEMS: Array<{ id: GameView; label: string; icon: string; hint: string }> = [
  { id: "town", label: "城鎮", icon: "城", hint: "領地設施" },
  { id: "route", label: "遠征", icon: "路", hint: "選擇路線" },
  { id: "battle", label: "對局", icon: "牌", hint: "十三支戰" },
  { id: "workshop", label: "鍊成", icon: "鍊", hint: "花色基因" },
  { id: "development", label: "記錄", icon: "卷", hint: "開發卷宗" },
];
const RESOURCES: ResourceAmount[] = [
  { label: "金幣", value: "12,480", icon: "G", tone: "gold" },
  { label: "聲望", value: "246", icon: "★", tone: "jade" },
  { label: "靈玉", value: "38", icon: "◆", tone: "violet" },
];
const WEEK_LABELS = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

function formatDate(week: number): string {
  const monthIndex = Math.floor((week - 1) / 4) % WEEK_LABELS.length;
  return `第 ${Math.floor((week - 1) / 48) + 1} 年 ${WEEK_LABELS[monthIndex]} 第 ${((week - 1) % 4) + 1} 週`;
}

function SpeedButton({ speed, onChange }: { speed: GameSpeed; onChange: (speed: GameSpeed) => void }) {
  const nextSpeed: GameSpeed = speed === 0 ? 1 : speed === 1 ? 2 : 0;
  return <button type="button" className="clock-button" onClick={() => onChange(nextSpeed)} aria-label="切換遊戲速度"><span aria-hidden="true">{speed === 0 ? "▶" : speed === 1 ? "▶▶" : "▶▶▶"}</span><small>{speed === 0 ? "暫停" : `${speed}x`}</small></button>;
}

export default function GameShell({ views }: { views: Record<GameView, ReactNode> }) {
  const [activeView, setActiveView] = useState<GameView>("town");
  const [week, setWeek] = useState(1);
  const [speed, setSpeed] = useState<GameSpeed>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (speed === 0) return;
    const interval = window.setInterval(() => setWeek((current) => current + 1), speed === 1 ? 4500 : 1800);
    return () => window.clearInterval(interval);
  }, [speed]);

  const dateLabel = useMemo(() => formatDate(week), [week]);
  function navigate(view: GameView) {
    setActiveView(view);
    setMenuOpen(false);
  }

  return <main className="game-app"><div className="game-frame">
    <header className="game-hud">
      <div className="game-brand"><span className="brand-mark">XIII</span><div><strong>CHAIN XIII</strong><span>十三城演武錄</span></div></div>
      <div className="date-panel" aria-live="polite"><span className="hud-label">演武曆</span><strong>{dateLabel}</strong></div>
      <div className="resource-row" aria-label="資源">{RESOURCES.map((resource) => <div className={`resource resource-${resource.tone}`} key={resource.label}><span className="resource-icon" aria-hidden="true">{resource.icon}</span><span><small>{resource.label}</small><strong>{resource.value}</strong></span></div>)}</div>
      <SpeedButton speed={speed} onChange={setSpeed} />
    </header>

    <div className="game-viewport">
      <div className="quest-ribbon"><span className="status-dot" />主線：完成初次分墩</div>
      <section className={`game-screen game-screen-${activeView}`} aria-label="遊戲畫面">{views[activeView]}</section>
      {menuOpen && <div className="system-overlay" role="dialog" aria-modal="true" aria-label="系統選單"><div className="system-window"><span className="pixel-kicker">SYSTEM</span><h2>遊戲暫停</h2><p>目前進度保存在本機。關閉選單即可繼續。</p><button type="button" className="pixel-button" onClick={() => setMenuOpen(false)}>返回遊戲</button></div></div>}
    </div>

    <nav className="game-nav" aria-label="主要選單">{VIEW_ITEMS.map((item) => <button type="button" key={item.id} className={`game-nav-item${activeView === item.id ? " is-active" : ""}`} onClick={() => navigate(item.id)} aria-current={activeView === item.id ? "page" : undefined}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span><small>{item.hint}</small></button>)}<button type="button" className="game-nav-item nav-menu" onClick={() => { setSpeed(0); setMenuOpen(true); }}><span className="nav-icon" aria-hidden="true">≡</span><span>選單</span><small>系統</small></button></nav>
  </div></main>;
}