import { useState } from "react";
import townScene from "../assets/pixel/chain-xiii-town.webp";
import tacticianPortrait from "../assets/pixel/tactician-portrait.webp";

const BUILDINGS = [
  { id: "dojo", name: "十三演武場", note: "配置十三張牌，挑戰三墩對局。", action: "前往對局", x: 25, y: 72, tone: "brick" },
  { id: "forge", name: "花色鍊成屋", note: "接合怪物基因，改寫卡牌花色。", action: "開始鍊成", x: 67, y: 27, tone: "jade" },
  { id: "archive", name: "戰譜藏書閣", note: "檢視戰績、規則與城鎮紀錄。", action: "翻閱戰譜", x: 68, y: 72, tone: "violet" },
] as const;

type BuildingId = (typeof BUILDINGS)[number]["id"];

export default function TownView() {
  const [selectedId, setSelectedId] = useState<BuildingId>("dojo");
  const [message, setMessage] = useState("城主，今日的十三支演武已經準備好了。");
  const selected = BUILDINGS.find((building) => building.id === selectedId) ?? BUILDINGS[0];

  function selectBuilding(id: BuildingId) {
    const building = BUILDINGS.find((item) => item.id === id) ?? BUILDINGS[0];
    setSelectedId(id);
    setMessage(`${building.name}：${building.note}`);
  }

  function enterBuilding() {
    setMessage(`${selected.name}已標記。請從下方指令列進入對應系統。`);
  }

  return <div className="town-view">
    <section className="town-map" aria-label="十三城地圖">
      <img className="town-scene" src={townScene} alt="十三城像素地圖，包含演武場、鍊成屋與藏書閣" />
      <div className="town-vignette" aria-hidden="true" />
      <div className="location-plaque"><span>十三城</span><strong>初陣之地</strong><small>Lv.1</small></div>
      <div className="town-stats" aria-label="城鎮狀態"><span>熱 <strong>72</strong></span><span>民 <strong>13</strong></span><span>勝 <strong>03</strong></span></div>
      {BUILDINGS.map((building) => <button
        type="button"
        key={building.id}
        className={`facility-hotspot hotspot-${building.tone}${selectedId === building.id ? " is-selected" : ""}`}
        style={{ left: `${building.x}%`, top: `${building.y}%` }}
        onClick={() => selectBuilding(building.id)}
        aria-label={building.name}
        aria-pressed={selectedId === building.id}
      ><span className="hotspot-cursor" aria-hidden="true">◆</span><span className="hotspot-label">{building.name}</span></button>)}
      <span className="town-hero" aria-hidden="true"><i className="hero-shadow" /><i className="hero-body" /><i className="hero-head" /><i className="hero-scarf" /></span>
    </section>

    <aside className={`facility-panel panel-${selected.tone}`} aria-live="polite">
      <span className="panel-number">0{BUILDINGS.findIndex((building) => building.id === selected.id) + 1}</span>
      <div><span className="pixel-kicker">FACILITY</span><h1>{selected.name}</h1><p>{selected.note}</p></div>
      <button type="button" className="enter-button" onClick={enterBuilding}>{selected.action}<span aria-hidden="true">▶</span></button>
    </aside>

    <section className="dialog-box" aria-live="polite">
      <div className="portrait-frame"><img src={tacticianPortrait} alt="牌術師玄離" /></div>
      <div className="dialog-copy"><span className="speaker-name">牌術師・玄離</span><p>{message}</p></div>
      <span className="dialog-next" aria-hidden="true">▼</span>
    </section>
  </div>;
}