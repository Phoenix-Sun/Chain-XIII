import type { MetaState } from "./save";

export interface SkillTreeNode {
  id: string;
  name: string;
  detail: string;
  cost: number;
  prerequisiteIds: string[];
}

export interface SkillTreeModifiers {
  geneCapacityBonus: number;
  frontBonus: number;
  startingCrystals: number;
}

export const skillNodes: SkillTreeNode[] = [
  { id: "expanded-satchel", name: "擴充基因袋", detail: "每趟遠征的基因庫容量 +2。", cost: 80, prerequisiteIds: [] },
  { id: "opening-drill", name: "開局演練", detail: "每場戰鬥的頭墩平手比較 +1。", cost: 120, prerequisiteIds: [] },
  { id: "route-network", name: "路線網絡", detail: "每趟遠征出發時帶著 5 水晶。", cost: 160, prerequisiteIds: ["expanded-satchel"] },
];

export function getSkillNode(skillId: string): SkillTreeNode | undefined {
  return skillNodes.find((node) => node.id === skillId);
}

export function skillTreeModifiers(skillIds: string[]): SkillTreeModifiers {
  const unlocked = new Set(skillIds);
  return {
    geneCapacityBonus: unlocked.has("expanded-satchel") ? 2 : 0,
    frontBonus: unlocked.has("opening-drill") ? 1 : 0,
    startingCrystals: unlocked.has("route-network") ? 5 : 0,
  };
}

export function buySkillNode(meta: MetaState, skillId: string): MetaState {
  const node = getSkillNode(skillId);
  if (!node) throw new Error("找不到永久技能節點");
  if (meta.permanentSkillNodeIds.includes(skillId)) throw new Error("這個技能節點已經解鎖");
  const missing = node.prerequisiteIds.filter((prerequisiteId) => !meta.permanentSkillNodeIds.includes(prerequisiteId));
  if (missing.length > 0) throw new Error(`需要先解鎖：${missing.join("、")}`);
  if (meta.crystals < node.cost) throw new Error(`解鎖需要 ${node.cost} 水晶`);
  return {
    ...meta,
    crystals: meta.crystals - node.cost,
    permanentSkillNodeIds: [...meta.permanentSkillNodeIds, skillId],
  };
}
