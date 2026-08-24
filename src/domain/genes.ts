import type { GeneChain, GeneFactor, GeneTier } from "./template";

export type GeneSlot = "short3" | "long5A" | "long5B";

export interface FusionPreview {
  leftId: string;
  rightId: string;
  maxLength: number;
  factors: GeneFactor[];
  removedFromFront: number;
  joined: "fused" | "linked";
}

function upgradeTier(left: GeneTier, right: GeneTier): GeneTier {
  return Math.min(3, (Math.max(left, right) + 1) as GeneTier) as GeneTier;
}

function joinFactors(left: GeneFactor[], right: GeneFactor[]): { factors: GeneFactor[]; joined: "fused" | "linked" } {
  const leftTail = left[left.length - 1];
  const rightHead = right[0];
  if (leftTail.suit !== rightHead.suit) return { factors: [...left, ...right], joined: "linked" };
  return {
    factors: [
      ...left.slice(0, -1),
      { suit: leftTail.suit, tier: upgradeTier(leftTail.tier, rightHead.tier) },
      ...right.slice(1),
    ],
    joined: "fused",
  };
}

export function previewFusion(left: GeneChain, right: GeneChain, maxLength: number): FusionPreview {
  if (left.id === right.id) throw new Error("不能用同一條鏈融合自己");
  if (!Number.isInteger(maxLength) || maxLength <= 0) throw new Error("鍊成上限必須是正整數");
  const joined = joinFactors(left.factors, right.factors);
  const removedFromFront = Math.max(0, joined.factors.length - maxLength);
  return {
    leftId: left.id,
    rightId: right.id,
    maxLength,
    factors: joined.factors.slice(removedFromFront),
    removedFromFront,
    joined: joined.joined,
  };
}

export function commitFusion(preview: FusionPreview): GeneChain {
  if (preview.factors.length > preview.maxLength) throw new Error("融合結果超過鏈長上限");
  return { id: `fusion:${preview.leftId}+${preview.rightId}`, factors: preview.factors.map((factor) => ({ ...factor })) };
}

export function canEquip(chain: GeneChain, slot: GeneSlot): boolean {
  const expectedLength = slot === "short3" ? 3 : 5;
  return chain.factors.length === expectedLength;
}
