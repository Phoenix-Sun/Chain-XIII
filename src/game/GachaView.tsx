import { useState } from "react";
import { drawCharacter, CHARACTER_DRAW_COST } from "../domain/gacha";
import type { MetaState } from "../domain/save";
import { catalog } from "../content/catalog";
import type { Navigate } from "./types";

function characterName(id: string): string {
  return id.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default function GachaView({ meta, onMetaChange, onNavigate }: { meta: MetaState; onMetaChange: (meta: MetaState) => void; onNavigate: Navigate }) {
  const [message, setMessage] = useState("完成遠征取得水晶，再來抽角色。");
  const [drawCount, setDrawCount] = useState(0);
  const ownedIds = new Set(meta.characters.map((character) => character.characterId));

  function draw() {
    try {
      const seed = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${drawCount}`;
      const result = drawCharacter(meta, catalog.characters.map((character) => character.id), seed);
      onMetaChange(result.meta);
      setDrawCount((count) => count + 1);
      setMessage(result.duplicate ? `${characterName(result.characterId)} 重複取得，轉為 1 枚角色印記。` : `取得新角色：${characterName(result.characterId)}。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "目前無法抽卡。");
    }
  }

  return <section className="gacha-view" aria-labelledby="gacha-title">
    <div className="screen-title-row"><div><h1 id="gacha-title">角色抽卡</h1></div><span className="rank-badge">水晶 {meta.crystals}</span></div>
    <p className="gacha-intro">用遠征取得的水晶抽取角色。重複角色會轉成角色印記，不會浪費。</p>
    <div className="gacha-panel"><div className="gacha-result" role="status">{message}</div><button type="button" className="primary-button" disabled={meta.crystals < CHARACTER_DRAW_COST} onClick={draw}>抽 1 次 · {CHARACTER_DRAW_COST} 水晶</button>{meta.crystals < CHARACTER_DRAW_COST && <small>還需要 {CHARACTER_DRAW_COST - meta.crystals} 水晶</small>}</div>
    <section className="account-collection" aria-label="帳號收藏進度"><strong>永久收藏</strong><span>基因鏈 {meta.geneInventory.length} 條</span><span>遺物 {meta.relicIds.length} 件</span><span>怪物圖鑑 {meta.unlockedMonsterCodexIds.length} 種</span></section>
    <section className="character-pool"><h2>角色卡池・{catalog.characters.length} 名</h2><div className="character-pool-grid">{catalog.characters.map((character) => <div className={`character-pool-card${ownedIds.has(character.id) ? " is-owned" : ""}`} key={character.id}><strong>{characterName(character.id)}</strong><span>{character.rarity} · {character.role}</span><small>{ownedIds.has(character.id) ? "已擁有" : "尚未取得"}</small></div>)}</div></section>
    <button type="button" className="secondary-button" onClick={() => onNavigate("town")}>回到營地</button>
  </section>;
}
