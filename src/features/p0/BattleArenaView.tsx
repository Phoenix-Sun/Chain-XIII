import { useMemo, useState } from "react";
import { chooseBestEnemyHand } from "../../domain/ai";
import { drawThirteen } from "../../domain/cards";
import { resolveBattle, type BattleResult } from "../../domain/combat";

import { enemyTiebreakerBonusForChapter, type RunMapNode } from "../../domain/map";
import { applySuitTemplate, buildSuitTemplate, currentSuitOf, type EquippedGenes } from "../../domain/template";
import { executeEffect } from "../../domain/effects";
import { battleRulesForRelics, relicDisablesBossRule, relicEffectLabel, type RelicBattleContext } from "../../domain/relics";
import { battleRulesForBlessings, blessingForId } from "../../domain/blessings";
import { skillTreeModifiers } from "../../domain/skillTree";
import type { RunState } from "../../domain/run";
import type { LaneId } from "../../domain/layout";
import type { Suit } from "../../domain/cards";
import { catalog } from "../../content/catalog";
import { monsterDisplayName } from "../../content/display";
import P0BattleLab from "./P0BattleLab";


const ELEMENT_LABELS = { water: "水", fire: "火", wind: "風", earth: "地" } as const;
const BOSS_RULE_LABELS: Record<string, string> = {
  "boss-neutralize-earth": "尾墩形成地元素時，第一次受到元素克制會改回普通點數比較。",
  "boss-swap-slots": "Boss 的兩個模板位置會在開戰時互換。",
  "boss-water-advantage": "Boss 頭墩形成水元素時，會取得額外比較優勢。",
};

function BattleResultPanel({ result, onContinue, onRetry, canRetry, failureMessage }: { result: BattleResult | null; onContinue?: () => void; onRetry?: () => void; canRetry?: boolean; failureMessage?: string }) {
  if (!result) return <section className="battle-result-card"><span className="pixel-kicker">敵方</span><h2>敵我三墩比較</h2><p>完成一副合法牌組後，系統會安排敵方 13 張牌並自動找出合法分牌。</p></section>;
  return <section className="battle-result-card" aria-live="polite"><div className="battle-result-heading"><div><span className="pixel-kicker">BATTLE RESULT</span><h2>{result.outcome === "win" ? "這場對局勝出" : result.outcome === "loss" ? "這場對局落敗" : "三墩平手"}</h2></div><strong className={`battle-score score-${result.outcome}`}>{result.playerWins} : {result.enemyWins}</strong></div><div className="lane-result-list">{result.lanes.map((lane) => <div className="lane-result" key={lane.lane}><span>{lane.lane === "front" ? "頭墩" : lane.lane === "middle" ? "中墩" : "尾墩"}</span><strong className={`winner-${lane.winner}`}>{lane.winner === "player" ? "我方勝" : lane.winner === "enemy" ? "敵方勝" : "平手"}</strong><small>{lane.playerRank.label} vs {lane.enemyRank.label} · {lane.playerElement ? ELEMENT_LABELS[lane.playerElement] : "無"} / {lane.enemyElement ? ELEMENT_LABELS[lane.enemyElement] : "無"}</small></div>)}</div>{result.outcome === "loss" && failureMessage && <p className="battle-rule-callout"><strong>本場損失</strong>{failureMessage}</p>}{canRetry && onRetry && <button type="button" className="secondary-button" onClick={onRetry}>使用岩甲守護・重新排牌</button>}{onContinue && <button type="button" className="primary-button" onClick={onContinue}>{result.outcome === "win" ? "領取獎勵" : "繼續遠征"}</button>}</section>;
}

export default function BattleArenaView({ partyCharacterIds = ["water-scout"], node, battleSeed = "CHAIN-XIII-P0-001", equippedGenes = {}, relicIds = [], run, onRunUpdated, onBattleComplete }: { partyCharacterIds?: string[]; node?: RunMapNode; battleSeed?: string; equippedGenes?: EquippedGenes; relicIds?: string[]; run?: RunState; onRunUpdated?: (run: RunState) => void; onBattleComplete?: (result: BattleResult, usedActiveAbility?: boolean) => void }) {
  const [result, setResult] = useState<BattleResult | null>(null);
  const [drawAttempt, setDrawAttempt] = useState(0);
  const [usedAbilities, setUsedAbilities] = useState<string[]>([]);
  const [frontBonus, setFrontBonus] = useState(() => skillTreeModifiers(run?.permanentSkillNodeIds ?? []).frontBonus);
  const [showEnemy, setShowEnemy] = useState(false);
  const [showHarmony, setShowHarmony] = useState(false);
  const monster = catalog.monsters.find((candidate) => candidate.id === node?.monsterId);
  const activeAbilityIds = catalog.characters.filter((character) => partyCharacterIds.includes(character.id)).map((character) => character.activeAbilityId);
  const relicContext: RelicBattleContext = { seed: battleSeed, bossRuleId: monster?.bossRuleId, equippedGenes };
  const relicRules = useMemo(() => {
    const relic = battleRulesForRelics(relicIds, relicContext);
    const blessing = battleRulesForBlessings(run?.blessingIds ?? []);
    const laneBonuses = { ...relic.laneBonuses };
    for (const lane of ["front", "middle", "back"] as const) laneBonuses[lane] = (laneBonuses[lane] ?? 0) + (blessing.laneBonuses?.[lane] ?? 0) + (run?.discoveredRunFlags.includes("next-battle:focus") ? 1 : 0);
    return { ...relic, laneBonuses, cursePenalty: run?.nextBattleSkullCurse ?? 0 };
  }, [battleSeed, equippedGenes, relicIds, monster?.bossRuleId, run?.blessingIds, run?.nextBattleSkullCurse, run?.discoveredRunFlags]);

  const playerCards = useMemo(() => applySuitTemplate(drawThirteen(drawAttempt === 0 ? battleSeed : `${battleSeed}:draw:${drawAttempt}`), buildSuitTemplate(equippedGenes)), [battleSeed, drawAttempt, equippedGenes]);
  const candidateCount = node?.type === "boss" ? 3 : node?.type === "elite" ? 2 : 1;
  const enemySelection = useMemo(() => {
    const candidates = Array.from({ length: candidateCount }, (_, candidateIndex) => {
      const base = drawThirteen(node ? `enemy:${battleSeed}:${node.id}:candidate:${candidateIndex}` : `enemy:preview:${candidateIndex}`);
      if (!monster) return base;
      const template = monster.bossRuleId === "boss-swap-slots" && !relicDisablesBossRule(relicIds, "boss-swap-slots") ? [...monster.template13.slice(1), monster.template13[0]] : monster.template13;
      return applySuitTemplate(base, template);
    });
    return chooseBestEnemyHand(candidates);
  }, [battleSeed, candidateCount, monster, node?.id, relicIds]);
  const enemyCards = enemySelection.cards;

  function applyBattleEffect(abilityId: string): boolean {
    if (!run) return true;
    const sourceId = partyCharacterIds.find((characterId) => catalog.characters.find((character) => character.id === characterId)?.activeAbilityId === abilityId) ?? abilityId;
    const effectResult = executeEffect(abilityId, { phase: "battle-ready", run, sourceId });
    if (!effectResult.applied) return false;
    onRunUpdated?.(effectResult.run);
    return true;
  }
  function useAbility(abilityId: string) {
    if (usedAbilities.includes(abilityId) || run?.discoveredRunFlags.includes(`effect:${abilityId}`)) return;
    if (!applyBattleEffect(abilityId)) return;
    setUsedAbilities((current) => [...current, abilityId]);
    if (abilityId === "ability-ripple") { setResult(null); setDrawAttempt((current) => current + 1); }
    if (abilityId === "ability-sight") setShowEnemy(true);
    if (abilityId === "ability-harmony") setShowHarmony(true);
    if (abilityId === "ability-spark") setFrontBonus((current) => current + 1);
  }
  function useElementShift(lane: LaneId, suit: Suit): boolean {
    if (usedAbilities.includes("ability-flow") || run?.discoveredRunFlags.includes("effect:ability-flow")) return false;
    if (!run) {
      setUsedAbilities((current) => [...current, "ability-flow"]);
      return true;
    }
    if (!applyBattleEffect("ability-flow")) return false;
    setUsedAbilities((current) => [...current, "ability-flow"]);
    return true;
  }
  function retryWithShell() {
    if (run) {
      const sourceId = partyCharacterIds.find((characterId) => catalog.characters.find((character) => character.id === characterId)?.activeAbilityId === "ability-shell") ?? "ability-shell";
      const effectResult = executeEffect("ability-shell", { phase: "battle-resolved", run, sourceId });
      if (!effectResult.applied) return;
      onRunUpdated?.(effectResult.run);
    }
    setUsedAbilities((current) => [...current, "ability-shell"]);
    setResult(null);
    setDrawAttempt((current) => current + 1);
  }
  const nodeLabel = node?.type === "boss" ? "Boss" : node?.type === "elite" ? "菁英" : "怪物";
  const chapterEnemyBonus = enemyTiebreakerBonusForChapter(node?.chapter);
  const bossRule = monster?.bossRuleId ? BOSS_RULE_LABELS[monster.bossRuleId] : undefined;
  const abilityLabels: Record<string, string> = { "ability-ripple": "水紋回響・重抽", "ability-sight": "風之預視・看敵牌", "ability-harmony": "四象協調・看提示", "ability-spark": "火花決鬥・頭墩加成" };
  const enemyName = monster ? monsterDisplayName(monster) : "訓練對手";
  return <section className="battle-stage" aria-label="十三支戰場">
    <section className="battle-enemy-panel" aria-label="敵方資訊">
      <div className="enemy-emblem" aria-hidden="true">{node?.type === "boss" ? "王" : node?.type === "elite" ? "強" : "敵"}</div>
      <div className="enemy-copy"><span className="pixel-kicker">{nodeLabel}</span><strong>{enemyName}</strong><small>等待你排出三墩</small></div>
      <div className="enemy-intent"><span>敵方意圖</span><strong>準備比較</strong></div>
    </section>
    <div className="battle-turn-guide"><span>本回合目標</span><strong>用 13 張牌排出頭／中／尾三墩</strong><small>頭墩 3 張・中墩 5 張・尾墩 5 張</small></div>
    <div className="battle-context"><span>{node?.chapter ? `第 ${node.chapter} 章・` : ""}{nodeLabel}{monster ? `：${enemyName}` : ""}</span><span>本次出戰：{partyCharacterIds.length} 名角色</span></div>
    {candidateCount > 1 && <p className="battle-rule-callout"><strong>{node?.type === "boss" ? "Boss 三組候選牌" : "菁英兩組候選牌"}</strong>敵方會從候選牌組中選出牌型結構較高的一組。</p>}
    {chapterEnemyBonus > 0 && <p className="battle-rule-callout"><strong>章節強度 +{chapterEnemyBonus}</strong>同牌型與元素都未分出勝負時，敵方取得比較加成。</p>}
    {bossRule && <p className="battle-rule-callout"><strong>Boss 特性</strong>{bossRule}</p>}
    {(run?.blessingIds?.length ?? 0) > 0 && <div className="battle-blessing-strip" aria-label="下一場祝福"><strong>祝福已啟用</strong>{run?.blessingIds?.map((id) => <span key={id}>{blessingForId(id)?.name ?? id}：{blessingForId(id)?.effect}</span>)}</div>}
    {(run?.nextBattleSkullCurse ?? 0) > 0 && <p className="battle-rule-callout"><strong>Skull 詛咒</strong>本場同牌型比較 -{run?.nextBattleSkullCurse}；戰鬥結束後解除。</p>}
    {relicIds.length > 0 && <div className="battle-relic-strip" aria-label="本場遺物效果"><strong>遺物已生效</strong>{relicIds.map((relicId) => { const relic = catalog.relics.find((candidate) => candidate.id === relicId); return <span key={relicId}><b>{relic?.name ?? relicId}</b><small>{relic?.trigger ?? "戰鬥被動"}</small>{relicEffectLabel(relicId, relicContext)}</span>; })}</div>}
    <div className="battle-abilities" aria-label="本場可用技能">{activeAbilityIds.filter((abilityId) => abilityLabels[abilityId]).map((abilityId) => <button type="button" key={abilityId} className="ability-button" disabled={usedAbilities.includes(abilityId) || Boolean(result)} onClick={() => useAbility(abilityId)}>{abilityLabels[abilityId]}{usedAbilities.includes(abilityId) ? "・已用" : ""}</button>)}</div>
    {showHarmony && <p className="battle-rule-callout"><strong>三墩提示</strong>先確保牌型順序，再用元素克制爭取同牌型時的勝負。</p>}
    {showEnemy && <div className="enemy-preview" aria-label="敵方牌面預覽">敵方目前花色：{enemyCards.map((card) => `${ELEMENT_LABELS[currentSuitOf(card)]}${card.rank}`).join("、")}</div>}
    <section className="battle-table" aria-label="十三支牌桌">
      {!result && <P0BattleLab key={`battle-draw-${drawAttempt}`} cards={playerCards} canShiftElement={activeAbilityIds.includes("ability-flow") && !usedAbilities.includes("ability-flow") && !run?.discoveredRunFlags.includes("effect:ability-flow")} onElementShift={useElementShift} onLayoutConfirmed={(layout, _cards, laneElementOverrides) => { setResult(resolveBattle(layout, enemySelection.lanes, { bossRuleId: monster?.bossRuleId, frontBonus, enemyTiebreakerBonus: chapterEnemyBonus, laneElementOverrides, ...relicRules })); }} />}
    </section>
    <BattleResultPanel result={result} failureMessage={node?.type === "boss" ? "Boss 戰敗，遠征血量直接歸零。" : node?.type === "elite" ? "菁英戰敗，遠征血量扣除 2 點。" : "普通戰鬥戰敗，遠征血量扣除 1 點。"} canRetry={Boolean(result?.outcome === "loss" && activeAbilityIds.includes("ability-shell") && !usedAbilities.includes("ability-shell"))} onRetry={retryWithShell} onContinue={result && onBattleComplete ? () => usedAbilities.length > 0 ? onBattleComplete(result, true) : onBattleComplete(result) : undefined} />
  </section>;
}
