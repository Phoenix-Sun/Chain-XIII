import type { RunMapNode } from "./map";
import type { GeneChain } from "./template";

export interface RunReward {
  crystals: number;
  geneChainId?: string;
  geneChain?: GeneChain;
  relicId?: string;
  title: string;
  detail: string;
}

const GENE_REWARD_IDS = [
  "gene-water-fire-wind",
  "gene-earth-water-fire",
  "gene-fire-wind-earth-water-fire",
] as const;

export function rewardForNode(node: RunMapNode): RunReward {
  const geneChainId = GENE_REWARD_IDS[(node.row + node.column) % GENE_REWARD_IDS.length];
  if (node.type === "boss") return { crystals: 80, geneChainId, title: "Boss 獎勵", detail: "擊敗 Boss，取得大量水晶與一條基因鏈。" };
  if (node.type === "elite") return { crystals: 25, geneChainId, title: "強敵獎勵", detail: "打倒強敵，取得水晶與一條基因鏈。" };
  if (node.type === "relic") return { crystals: 18, relicId: node.relicId ?? `relic-${(node.row + node.column) % 15 + 1}`, title: "遺物獎勵", detail: "找到一件遺物，帶回營地後永久收進收藏。" };
  if (node.type === "event") return { crystals: 12, geneChainId, title: "事件獎勵", detail: "做出選擇後取得水晶與一條基因鏈。" };
  return { crystals: 15, geneChainId, title: "戰鬥獎勵", detail: "打倒怪物，取得水晶與一條基因鏈。" };
}
