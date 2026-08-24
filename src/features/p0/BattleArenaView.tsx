import { useState } from "react";
import { arrangeEnemyHand } from "../../domain/ai";
import { drawThirteen } from "../../domain/cards";
import { resolveBattle, type BattleResult } from "../../domain/combat";
import type { Lanes } from "../../domain/layout";
import P0BattleLab from "./P0BattleLab";

const ELEMENT_LABELS = { water: "水", fire: "火", wind: "風", earth: "地" } as const;

function BattleResultPanel({ result }: { result: BattleResult | null }) {
  if (!result) return <section className="battle-result-card"><span className="pixel-kicker">ENEMY AI · P3</span><h2>敵我三墩比較</h2><p>完成一副合法牌組後，系統會用固定 seed 生成敵方 13 張牌並自動找出合法分牌。</p></section>;
  return <section className="battle-result-card" aria-live="polite"><div className="battle-result-heading"><div><span className="pixel-kicker">BATTLE RESULT</span><h2>{result.outcome === "win" ? "這場對局勝出" : result.outcome === "loss" ? "這場對局落敗" : "三墩平手"}</h2></div><strong className={`battle-score score-${result.outcome}`}>{result.playerWins} : {result.enemyWins}</strong></div><div className="lane-result-list">{result.lanes.map((lane) => <div className="lane-result" key={lane.lane}><span>{lane.lane === "front" ? "頭墩" : lane.lane === "middle" ? "中墩" : "尾墩"}</span><strong className={`winner-${lane.winner}`}>{lane.winner === "player" ? "我方勝" : lane.winner === "enemy" ? "敵方勝" : "平手"}</strong><small>{lane.playerRank.label} vs {lane.enemyRank.label} · {lane.playerElement ? ELEMENT_LABELS[lane.playerElement] : "無"} / {lane.enemyElement ? ELEMENT_LABELS[lane.enemyElement] : "無"}</small></div>)}</div></section>;
}

export default function BattleArenaView() {
  const [result, setResult] = useState<BattleResult | null>(null);
  function resolvePlayerLayout(layout: Lanes) {
    const enemy = arrangeEnemyHand(drawThirteen("CHAIN-XIII-P3-ENEMY"));
    setResult(resolveBattle(layout, enemy));
  }
  return <div className="battle-arena"><P0BattleLab onLayoutConfirmed={resolvePlayerLayout} /><BattleResultPanel result={result} /></div>;
}
