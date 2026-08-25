import { SeededRandom } from "./random";
import type { MetaState } from "./save";

export const CHARACTER_DRAW_COST = 100;

export interface CharacterDrawResult {
  meta: MetaState;
  characterId: string;
  duplicate: boolean;
}

export function drawCharacter(meta: MetaState, poolCharacterIds: string[], seed: string): CharacterDrawResult {
  if (meta.crystals < CHARACTER_DRAW_COST) throw new Error(`抽卡需要 ${CHARACTER_DRAW_COST} 水晶`);
  if (poolCharacterIds.length === 0) throw new Error("角色卡池不可為空");
  const characterId = new SeededRandom(seed).pick(poolCharacterIds);
  const existing = meta.characters.find((character) => character.characterId === characterId);
  const characters = existing
    ? meta.characters.map((character) => character.characterId === characterId ? { ...character, imprintCount: character.imprintCount + 1 } : character)
    : [...meta.characters, { characterId, star: 1 as const, imprintCount: 0 }];
  return {
    characterId,
    duplicate: Boolean(existing),
    meta: { ...meta, crystals: meta.crystals - CHARACTER_DRAW_COST, characters },
  };
}
