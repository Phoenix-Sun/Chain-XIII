import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { GameSpeed, GameView, ResourceAmount } from "./types";

const VIEW_ITEMS: Array<{ id: GameView; label: string; icon: string; hint: string }> = [
  { id: "town", label: "領地", icon: "城", hint: "查看演武場" },
  { id: "battle", label: "對局", icon: "牌", hint: "進入十三支" },
  { id: "workshop", label: "鍊成", icon: "鍊", hint: "整理花色鏈" },
  { id: "development", label: "紀錄", icon: "卷", hint: "查看開發進度" },
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
  return <button type="button" className="clock-button" onClick={() => onChange(nextSpeed)} aria-label="切換遊戲速度">{speed === 0 ? "▶" : speed === 1 ? "▶▶" : "▶▶▶"}<span>{speed === 0 ? "暫停" : `${speed}x`}</span></button>;
}

export default function GameShell({ views }: { views: Record<GameView, ReactNode> }) {
  const [activeView, setActiveView] = useState<GameView>("town");
  const [week, setWeek] = useState(1);
  const [speed, setSpeed] = useState<GameSpeed>(0);
  useEffect(() => {
    if (speed === 0) return;
    const interval = window.setInterval(() => setWeek((current) => current + 1), speed === 1 ? 4500 : 1800);
    return () => window.clearInterval(interval);
  }, [speed]);
  const dateLabel = useMemo(() => formatDate(week), [week]);
  return <main className="game-app"><div className="game-frame">
    <header className="game-hud"><div className="game-brand"><span className="brand-mark">XIII</span><div><strong>CHAIN XIII</strong><span>花色鍊成版</span></div></div><div className="date-panel" aria-live="polite"><span className="hud-label">演武曆</span><strong>{dateLabel}</strong></div><div className="resource-row" aria-label="資源">{RESOURCES.map((resource) => <div className={`resource resource-${resource.tone}`} key={resource.label}><span className="resource-icon" aria-hidden="true">{resource.icon}</span><span><small>{resource.label}</small><strong>{resource.value}</strong></span></div>)}</div></header>
    <div className="game-toolbar"><div className="toolbar-status"><span className="status-dot" />今日目標：完成一場合法對局</div><SpeedButton speed={speed} onChange={setSpeed} /></div>
    <section className="game-screen" aria-label="遊戲畫面">{views[activeView]}</section>
    <nav className="game-nav" aria-label="主要選單">{VIEW_ITEMS.map((item) => <button type="button" key={item.id} className={`game-nav-item${activeView === item.id ? " is-active" : ""}`} onClick={() => setActiveView(item.id)} aria-current={activeView === item.id ? "page" : undefined}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span><small>{item.hint}</small></button>)}<button type="button" className="game-nav-item nav-menu" onClick={() => setSpeed(0)}><span className="nav-icon" aria-hidden="true">≡</span><span>選單</span><small>系統</small></button></nav>
  </div></main>;
}
