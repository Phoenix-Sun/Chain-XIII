import type { MonsterDefinition } from "./types";

export function monsterDisplayName(monster: MonsterDefinition): string {
  if (monster.kind === "normal") return `普通怪物 ${monster.id.match(/(\d+)$/)?.[1] ?? "?"}`;
  if (monster.kind === "elite") return `強敵 ${monster.id.match(/(\d+)$/)?.[1] ?? "?"}`;
  return `Boss・${monster.id.replace(/^boss-/, "").replaceAll("-", " ")}`;
}
