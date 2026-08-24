import { useState } from "react";

const BUILDINGS = [
  { id: "dojo", name: "十三演武場", note: "進行牌局與墩位訓練", icon: "牌", x: 18, y: 24, tone: "brick" },
  { id: "forge", name: "花色鍛造屋", note: "研究新的花色模板", icon: "鍊", x: 59, y: 18, tone: "jade" },
  { id: "archive", name: "戰譜藏書閣", note: "查看規則與對局紀錄", icon: "卷", x: 70, y: 61, tone: "violet" },
] as const;

const TILE_ROWS = Array.from({ length: 9 }, (_, row) => Array.from({ length: 12 }, (_, column) => `${row}-${column}`));

export default function TownView() {
  const [selectedId, setSelectedId] = useState("dojo");
  const selected = BUILDINGS.find((building) => building.id === selectedId) ?? BUILDINGS[0];

  return (
    <div className="town-view">
      <div className="screen-title-row">
        <div><span className="pixel-kicker">WORLD MAP · 01</span><h1>十三城・初陣之地</h1></div>
        <span className="rank-badge">城鎮 Lv.1</span>
      </div>

      <section className="pixel-map" aria-label="十三城地圖">
        <div className="map-grid" aria-hidden="true">
          {TILE_ROWS.flat().map((tile) => <span className="map-tile" key={tile} />)}
        </div>
        <div className="map-river" aria-hidden="true" />
        <div className="map-road map-road-main" aria-hidden="true" />
        <div className="map-road map-road-cross" aria-hidden="true" />
        {BUILDINGS.map((building) => (
          <button
            type="button"
            key={building.id}
            className={`map-building building-${building.tone}${selectedId === building.id ? " is-selected" : ""}`}
            style={{ left: `${building.x}%`, top: `${building.y}%` }}
            onClick={() => setSelectedId(building.id)}
            aria-label={building.name}
            aria-pressed={selectedId === building.id}
          >
            <span className="building-roof" />
            <span className="building-body">{building.icon}</span>
            <small>{building.name}</small>
          </button>
        ))}
        <span className="map-character character-one" aria-hidden="true">♟</span>
        <span className="map-character character-two" aria-hidden="true">♟</span>
        <span className="map-sign" aria-hidden="true">→</span>
      </section>

      <section className="town-inspector" aria-live="polite">
        <div className="inspector-icon">{selected.icon}</div>
        <div className="inspector-copy"><span className="pixel-kicker">設施情報</span><h2>{selected.name}</h2><p>{selected.note}</p></div>
        <button type="button" className="pixel-button" onClick={() => setSelectedId(selected.id === "dojo" ? "forge" : "dojo")}>切換焦點</button>
      </section>

      <div className="event-strip"><span className="event-mark">!</span><span>城內傳聞：新的牌局正在等待挑戰者。</span><button type="button" className="event-link">查看</button></div>

      <section className="quick-stats" aria-label="城鎮狀態">
        <div><small>城鎮熱度</small><strong>72</strong><span className="stat-meter"><i style={{ width: "72%" }} /></span></div>
        <div><small>居民</small><strong>13 / 20</strong><span className="stat-note">穩定</span></div>
        <div><small>連勝</small><strong>03</strong><span className="stat-note stat-good">上升中</span></div>
      </section>
    </div>
  );
}
