import { useMemo, useState } from "react";
import { characters } from "../content/catalog";
import { MAX_PARTY_SIZE, validatePartyCharacterIds } from "../domain/run";
import { characterUpgradeCost, upgradeCharacter } from "../domain/progression";
import type { MetaState } from "../domain/save";
import type { GameView } from "./types";

interface PartyViewProps {
  ownedCharacterIds: string[];
  selectedCharacterIds: string[];
  onConfirm: (characterIds: string[]) => void;
  onNavigate: (view: GameView) => void;
  meta?: MetaState;
  onMetaChange?: (meta: MetaState) => void;
}

const RARITY_LABELS = { R: "R", SR: "SR", SSR: "SSR" } as const;
const SUIT_LABELS = { water: "水", fire: "火", wind: "風", earth: "地" } as const;

export default function PartyView({ ownedCharacterIds, selectedCharacterIds, onConfirm, onNavigate, meta, onMetaChange }: PartyViewProps) {
  const [selected, setSelected] = useState(() => selectedCharacterIds.filter((id) => ownedCharacterIds.includes(id)).slice(0, MAX_PARTY_SIZE));
  const [upgradeMessage, setUpgradeMessage] = useState<string>();
  const ownedCharacters = useMemo(() => ownedCharacterIds.map((id) => characters.find((character) => character.id === id)).filter((character): character is (typeof characters)[number] => Boolean(character)), [ownedCharacterIds]);
  const errors = validatePartyCharacterIds(selected);

  function toggleCharacter(characterId: string) {
    setSelected((current) => current.includes(characterId) ? current.filter((id) => id !== characterId) : current.length < MAX_PARTY_SIZE ? [...current, characterId] : current);
  }

  function confirm() {
    if (errors.length > 0) return;
    onConfirm(selected);
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

  return <section className="party-view" aria-labelledby="party-title">
    <div className="screen-title-row"><div><span className="pixel-kicker">PARTY</span><h1 id="party-title">選擇這次遠征的角色</h1></div><span className="rank-badge">{selected.length}/{MAX_PARTY_SIZE}</span></div>
    <p className="party-intro">你擁有的角色越多，能組出的隊伍越多。這趟至少選 1 名，最多選 3 名。</p>
    <div className="party-roster" aria-label="已擁有角色">
      {ownedCharacters.map((character) => {
        const isSelected = selected.includes(character.id);
        const progress = meta?.characters.find((item) => item.characterId === character.id);
        return <div className="character-roster-entry" key={character.id}><button type="button" className={`character-card${isSelected ? " is-selected" : ""}`} onClick={() => toggleCharacter(character.id)} aria-pressed={isSelected}>
          <span className={`character-mark suit-${character.specialization ?? "earth"}`}>{character.specialization ? SUIT_LABELS[character.specialization] : "全"}</span>
          <span className="character-info"><strong>{character.id.replaceAll("-", " ")}</strong><small>{RARITY_LABELS[character.rarity]} · {character.role}</small></span>
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
