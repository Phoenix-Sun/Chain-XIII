import type { MetaState } from "../domain/save";
import { catalog } from "../content/catalog";
import { monsterDisplayName } from "../content/display";

const BOSS_NAMES: Record<string, string> = {
  "boss-lava-turtle": "熔岩巨龜",
  "boss-storm-bird": "風暴巨鳥",
  "boss-deep-sea": "深海巨獸",
};

const BOSS_RULES: Record<string, string> = {
  "boss-neutralize-earth": "尾墩形成地元素時，第一次受到元素克制會改回普通點數比較。",
  "boss-swap-slots": "Boss 的兩個模板位置會在開戰時互換。",
  "boss-water-advantage": "Boss 頭墩形成水元素時，會取得額外比較優勢。",
};

function monsterName(monster: (typeof catalog.monsters)[number]): string {
  if (monster.kind === "boss") return `Boss・${BOSS_NAMES[monster.id] ?? monster.id}`;
  return monsterDisplayName(monster);
}

function readableGene(id: string): string {
  return id.replace(/^gene-/, "").split("-").map((part) => ({ water: "水", fire: "火", wind: "風", earth: "地" }[part] ?? part)).join("／");
}

export default function CodexView({ meta }: { meta: MetaState }) {
  const discovered = new Set(meta.unlockedMonsterCodexIds);
  const ownedRelics = new Set(meta.relicIds);
  const discoveredCount = catalog.monsters.filter((monster) => discovered.has(monster.id)).length;
  const ownedRelicCount = catalog.relics.filter((relic) => ownedRelics.has(relic.id)).length;

  return <section className="codex-view" aria-label="收藏圖鑑">
    <div className="screen-title-row"><div><span className="pixel-kicker">FIELD RECORDS</span><h1>遠征圖鑑</h1></div><span className="rank-badge">{discoveredCount + ownedRelicCount} 項</span></div>
    <p className="codex-intro">每次擊敗怪物都會留下戰鬥紀錄；帶回營地的遺物則會永久保存在收藏中。先看懂敵人的規則，再決定下一趟要帶誰出發。</p>

    <section className="codex-section" aria-labelledby="monster-codex-title">
      <div className="codex-heading"><div><span className="pixel-kicker">ENCOUNTER LOG</span><h2 id="monster-codex-title">怪物圖鑑</h2></div><strong>{discoveredCount} / {catalog.monsters.length}</strong></div>
      <div className="codex-grid">{catalog.monsters.map((monster) => {
        const isKnown = discovered.has(monster.id);
        return <article className={`codex-entry${isKnown ? " is-known" : " is-unknown"}`} key={monster.id}>
          <div className={`codex-entry-mark kind-${monster.kind}`}>{monster.kind === "boss" ? "王" : monster.kind === "elite" ? "強" : "敵"}</div>
          <div className="codex-entry-copy"><strong>{isKnown ? monsterName(monster) : "未知遭遇"}</strong><small>{isKnown ? `${monster.kind === "boss" ? "Boss" : monster.kind === "elite" ? "菁英" : "普通怪物"}・${monster.dropChainPoolIds.map(readableGene).join("、")}` : "尚未遭遇"}</small>{isKnown && monster.bossRuleId && <p><b>戰鬥規則</b>{BOSS_RULES[monster.bossRuleId] ?? "已記錄特殊規則。"}</p>}</div><span className="codex-status">{isKnown ? "已記錄" : "?"}</span>
        </article>;
      })}</div>
    </section>

    <section className="codex-section" aria-labelledby="relic-codex-title">
      <div className="codex-heading"><div><span className="pixel-kicker">RELIC ARCHIVE</span><h2 id="relic-codex-title">遺物收藏</h2></div><strong>已發現 {ownedRelicCount} / {catalog.relics.length}</strong></div>
      <div className="relic-codex-grid">{catalog.relics.map((relic) => <article className={`relic-codex-entry${ownedRelics.has(relic.id) ? " is-owned" : ""}`} key={relic.id}><span className="relic-codex-icon">{ownedRelics.has(relic.id) ? "◆" : "?"}</span><div><strong>{ownedRelics.has(relic.id) ? relic.name : "未辨識遺物"}</strong><small>{ownedRelics.has(relic.id) ? relic.rarity.toUpperCase() : "尚未帶回營地"}</small></div></article>)}</div>
    </section>
  </section>;
}
