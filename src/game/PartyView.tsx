import { useMemo, useState } from "react";
import { characters } from "../content/catalog";
import { MAX_PARTY_SIZE, RUN_DIFFICULTIES, validatePartyCharacterIds, type RunDifficulty } from "../domain/run";
import { characterUpgradeCost, upgradeCharacter } from "../domain/progression";
import { buySkillNode, skillNodes } from "../domain/skillTree";
import type { MetaState } from "../domain/save";
import type { GameView } from "./types";

interface PartyViewProps {
  ownedCharacterIds: string[];
  selectedCharacterIds: string[];
  onConfirm: (characterIds: string[], difficulty: RunDifficulty) => void;
  onNavigate: (view: GameView) => void;
  meta?: MetaState;
  onMetaChange?: (meta: MetaState) => void;
}

const RARITY_LABELS = { R: "R", SR: "SR", SSR: "SSR" } as const;
const SUIT_LABELS = { water: "水", fire: "火", wind: "風", earth: "地" } as const;
const ACTIVE_ABILITY_LABELS: Record<string, { name: string; detail: string }> = {
  "ability-ripple": { name: "水紋回響・重抽", detail: "本場可重新選擇一次牌組。" },
  "ability-forge": { name: "鍛造師・全部啟用", detail: "本趟配置可將裝備基因格全部啟用一次。" },
  "ability-sight": { name: "風之預視・看敵牌", detail: "戰鬥中查看敵方牌面花色。" },
  "ability-shell": { name: "岩甲守護・重新排牌", detail: "戰鬥失敗時保留一次重排機會。" },
  "ability-flow": { name: "潮汐流轉・調整元素墩", detail: "本場可調整一個已形成墩位的元素。" },
  "ability-spark": { name: "火花決鬥・頭墩加成", detail: "本場頭墩同牌型比較取得加成。" },
  "ability-trade": { name: "風行商人・重擲一次", detail: "事件中可重擲一次骰子。" },
  "ability-map": { name: "石碑揭示下一層", detail: "查看下一層節點類型一次。" },
  "ability-harmony": { name: "四象協調・看提示", detail: "查看三墩元素成立條件。" },
};

export default function PartyView({ ownedCharacterIds, selectedCharacterIds, onConfirm, onNavigate, meta, onMetaChange }: PartyViewProps) {
  const [selected, setSelected] = useState(() => selectedCharacterIds.filter((id) => ownedCharacterIds.includes(id)).slice(0, MAX_PARTY_SIZE));
  const [difficulty, setDifficulty] = useState<RunDifficulty>("normal");
  const [upgradeMessage, setUpgradeMessage] = useState<string>();
  const ownedCharacters = useMemo(() => ownedCharacterIds.map((id) => characters.find((character) => character.id === id)).filter((character): character is (typeof characters)[number] => Boolean(character)), [ownedCharacterIds]);
  const errors = validatePartyCharacterIds(selected);

  function toggleCharacter(characterId: string) {
    setSelected((current) => current.includes(characterId) ? current.filter((id) => id !== characterId) : current.length < MAX_PARTY_SIZE ? [...current, characterId] : current);
  }

  function confirm() {
    if (errors.length > 0) return;
    onConfirm(selected, difficulty);
    onNavigate("route");
  }

  function upgrade(characterId: string) {
    if (!meta || !onMetaChange) return;
    try {
      onMetaChange(upgradeCharacter(meta, characterId));
      setUpgradeMessage("升級完成，角色能力會在下一場戰鬥生效。");
    } catch (error) {
      setUpgradeMessage(error instanceof Error ? error.message : "目前無法升級角色");
    }
  }

  function unlockSkill(skillId: string) {
    if (!meta || !onMetaChange) return;
    try {
      onMetaChange(buySkillNode(meta, skillId));
      setUpgradeMessage("永久技能已解鎖；下一趟遠征就會生效。");
    } catch (error) {
      setUpgradeMessage(error instanceof Error ? error.message : "目前無法解鎖技能");
    }
  }

  return <section className="party-view" aria-label="遠征編成">
    <div className="screen-title-row"><div><h1 id="party-title">組成你的遠征隊</h1></div><span className="rank-badge">{selected.length}/{MAX_PARTY_SIZE}</span></div>
    <section className="party-formation" aria-label="出戰隊列">
      <div className="formation-heading"><div><span>出戰隊列</span><strong>這趟遠征的夥伴</strong></div><small>{selected.length === 0 ? "尚未選擇" : "隊伍已準備"}</small></div>
      <div className="formation-slots">{Array.from({ length: MAX_PARTY_SIZE }, (_, index) => {
        const character = ownedCharacters.find((candidate) => candidate.id === selected[index]);
        return <div className={`formation-slot${character ? " is-filled" : ""}`} key={character?.id ?? `empty-${index}`}><span className="formation-slot-number">0{index + 1}</span>{character ? <><strong>{character.id.replaceAll("-", " ")}</strong><small>{character.role}</small></> : <span className="formation-empty">待命</span>}</div>;
      })}</div>
    </section>
    <section className="difficulty-picker" aria-label="遠征難度">
      <div className="difficulty-heading"><div><strong>選擇遠征難度</strong></div><small>十三支戰敗會消耗 1 條命</small></div>
      <div className="difficulty-options">{(Object.entries(RUN_DIFFICULTIES) as Array<[RunDifficulty, (typeof RUN_DIFFICULTIES)[RunDifficulty]]>).map(([id, option]) => <button type="button" key={id} className={`difficulty-option difficulty-${id}${difficulty === id ? " is-selected" : ""}`} aria-pressed={difficulty === id} onClick={() => setDifficulty(id)}><strong>{option.label}</strong><span>{option.lives} 條命</span><small>{option.detail}</small></button>)}</div>
    </section>
    <section className="skill-tree-panel" aria-label="永久技能樹">
      <div className="skill-tree-heading"><div><strong>永久技能樹</strong></div><small>水晶 {meta?.crystals ?? 0}</small></div>
      <p>把遠征帶回的水晶投入長期能力；技能會在下一趟新遠征開始時生效。</p>
      <div className="skill-tree-list">{skillNodes.map((node) => {
        const unlocked = Boolean(meta?.permanentSkillNodeIds.includes(node.id));
        const missing = node.prerequisiteIds.some((id) => !meta?.permanentSkillNodeIds.includes(id));
        return <div className={`skill-tree-node${unlocked ? " is-unlocked" : ""}`} key={node.id}><div><strong>{node.name}</strong><small>{node.detail}</small>{node.prerequisiteIds.length > 0 && <em>前置：{node.prerequisiteIds.join("、")}</em>}</div><button type="button" className="skill-unlock" disabled={unlocked || missing || !meta || meta.crystals < node.cost} onClick={() => unlockSkill(node.id)}>{unlocked ? "已解鎖" : `${node.cost} 水晶`}</button></div>;
      })}</div>
    </section>
    <p className="party-intro">從持有角色中選 1～3 名。不同花色與職能會改變你在牌桌上的解法。</p>
    <div className="roster-heading"><strong>角色名冊</strong><small>點選角色加入或移出隊列</small></div>
    <div className="party-roster" aria-label="已擁有角色">
      {ownedCharacters.map((character) => {
        const isSelected = selected.includes(character.id);
        const progress = meta?.characters.find((item) => item.characterId === character.id);
        return <div className="character-roster-entry" key={character.id}><button type="button" className={`character-card${isSelected ? " is-selected" : ""}`} onClick={() => toggleCharacter(character.id)} aria-pressed={isSelected}>
          <span className={`character-mark suit-${character.specialization ?? "earth"}`}>{character.specialization ? SUIT_LABELS[character.specialization] : "全"}</span>
          <span className="character-info"><strong>{character.id.replaceAll("-", " ")}</strong><small>{RARITY_LABELS[character.rarity]} · {character.role}</small><small className="character-ability"><b>主動技：</b>{ACTIVE_ABILITY_LABELS[character.activeAbilityId]?.name ?? character.activeAbilityId}・{ACTIVE_ABILITY_LABELS[character.activeAbilityId]?.detail ?? "本場特殊效果。"}</small></span>
          <span className="character-star" aria-label={`目前 ${progress?.star ?? 1} 星`}>{"★".repeat(progress?.star ?? 1)}</span><span className="character-check" aria-hidden="true">{isSelected ? "✓" : "＋"}</span>
        </button>{progress && progress.star < 5 && <button type="button" className="character-upgrade" onClick={() => upgrade(character.id)} disabled={!meta || meta.crystals < characterUpgradeCost(progress.star)}>升級至 {progress.star + 1} 星・{characterUpgradeCost(progress.star)} 水晶</button>}</div>;
      })}
    </div>
    {ownedCharacters.length === 1 && <p className="party-hint">目前只有預設角色也可以開始第一趟遠征。之後可以用水晶抽到更多角色。</p>}
    {upgradeMessage && <p className="party-hint" role="status">{upgradeMessage}</p>}
    {errors.length > 0 && <p className="party-error" role="alert">{errors[0]}</p>}
    <div className="party-actions"><button type="button" className="secondary-button" onClick={() => onNavigate("town")}>回到營地</button><button type="button" className="enter-button" onClick={confirm} disabled={errors.length > 0}>開始遠征 <span aria-hidden="true">▶</span></button></div>
  </section>;
}
