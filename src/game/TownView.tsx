import { useState } from "react";
import townScene from "../assets/pixel/chain-xiii-town.webp";
import type { Navigate } from "./types";

const BUILDINGS = [
  { id: "party", name: "隊伍帳篷", note: "選擇這次遠征要出戰的角色。", action: "選擇隊伍", target: "party", x: 25, y: 72, tone: "brick" },
  { id: "route", name: "路線桌", note: "先選擇出戰角色，再決定下一個節點。", action: "選擇隊伍", target: "route", x: 67, y: 27, tone: "jade" },
  { id: "workshop", name: "配置篝火", note: "選擇基因鏈，調整牌的花色。", action: "開始配置", target: "workshop", x: 68, y: 72, tone: "violet" },
  { id: "gacha", name: "角色召集處", note: "用遠征取得的水晶抽取角色。", action: "前往抽卡", target: "gacha", x: 26, y: 27, tone: "gold" },
] as const;

type BuildingId = (typeof BUILDINGS)[number]["id"];

export default function TownView({ crystals = 0, onNavigate }: { crystals?: number; onNavigate: Navigate }) {
  const [selectedId, setSelectedId] = useState<BuildingId>("party");
  const selected = BUILDINGS.find((building) => building.id === selectedId) ?? BUILDINGS[0];

  function selectBuilding(id: BuildingId) {
    setSelectedId(id);
  }

  function enterBuilding() {
    onNavigate(selected.target);
  }

  return <div className="town-view">
    <section className="town-map" aria-label="遠征營地">
      <img className="town-scene" src={townScene} alt="遠征營地像素場景，包含隊伍帳篷、路線桌與配置篝火" />
      <div className="town-vignette" aria-hidden="true" />
      <div className="location-plaque"><span>遠征營地</span><strong>出發前整備</strong><small>目前 · 水晶 {crystals}</small></div>
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

    <aside className={`facility-panel camp-command-panel panel-${selected.tone}`} aria-live="polite">
      <section className="camp-command-card" aria-label="營地指揮台">
        <div className="camp-command-copy"><span className="pixel-kicker">下一步</span><h1>{selected.name}</h1><p>{selected.note}</p></div>
        <button type="button" className="enter-button" onClick={enterBuilding}>{selected.action}<span aria-hidden="true">▶</span></button>
      </section>
    </aside>
  </div>;
}