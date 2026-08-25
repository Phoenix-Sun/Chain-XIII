import type { MetaState } from "./save";

export const MAX_CHARACTER_STAR = 5;

export function characterUpgradeCost(star: number): number {
  return 60 * star;
}

export function upgradeCharacter(meta: MetaState, characterId: string): MetaState {
  const progress = meta.characters.find((character) => character.characterId === characterId);
  if (!progress) throw new Error("只能升級已擁有的角色");
  if (progress.star >= MAX_CHARACTER_STAR) throw new Error("角色已達最高星級");
  const cost = characterUpgradeCost(progress.star);
  if (meta.crystals < cost) throw new Error(`升級需要 ${cost} 水晶`);
  return {
    ...meta,
    crystals: meta.crystals - cost,
    characters: meta.characters.map((character) => character.characterId === characterId ? { ...character, star: (character.star + 1) as 1 | 2 | 3 | 4 | 5 } : character),
  };
}
