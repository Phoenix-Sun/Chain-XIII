import type { RunMapNode } from "./map";
import type { GeneChain } from "./template";
import type { RunDifficulty } from "./run";

export interface RunReward {
  crystals: number;
  geneChainId?: string;
  geneChain?: GeneChain;
  relicId?: string;
  title: string;
  detail: string;
  choices?: RewardChoice[];
}

export interface RewardChoice {
  id: string;
  label: string;
  detail: string;
  geneChainId?: string;
  geneChain?: GeneChain;
  relicId?: string;
}

const GENE_REWARD_IDS = [
  "gene-water-fire-wind",
  "gene-earth-water-fire",
  "gene-fire-wind-earth-water-fire",
] as const;

export const RUN_REWARD_MULTIPLIERS: Record<RunDifficulty, number> = { easy: 0.75, normal: 1, hard: 1.5 };

export function rewardMultiplierForDifficulty(difficulty: RunDifficulty): number {
  return RUN_REWARD_MULTIPLIERS[difficulty];
}

export function scaleRewardCrystals(baseCrystals: number, difficulty: RunDifficulty): number {
  return Math.max(1, Math.round(baseCrystals * rewardMultiplierForDifficulty(difficulty)));
}

export function rewardForNode(node: RunMapNode, difficulty: RunDifficulty = "normal"): RunReward {
  const geneChainId = GENE_REWARD_IDS[(node.row + node.column) % GENE_REWARD_IDS.length];
  const crystals = (base: number) => scaleRewardCrystals(base, difficulty);
  if (node.type === "boss") return { crystals: crystals(80), geneChainId, title: "Boss 獎勵", detail: "擊敗 Boss，取得大量水晶與一條基因鏈。" };
  if (node.type === "elite") return { crystals: crystals(25), geneChainId, title: "菁英獎勵", detail: "打倒菁英，取得水晶與一條基因鏈。" };
  if (node.type === "relic") return { crystals: crystals(18), relicId: node.relicId ?? `relic-${(node.row + node.column) % 15 + 1}`, title: "遺物獎勵", detail: "找到一件遺物，帶回營地後永久收進收藏。" };
  if (node.type === "event") return { crystals: crystals(12), geneChainId, title: "事件獎勵", detail: "做出選擇後取得水晶與一條基因鏈。" };
  return { crystals: crystals(15), geneChainId, title: "戰鬥獎勵", detail: "打倒怪物，取得水晶與一條基因鏈。" };
}
