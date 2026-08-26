import type { GeneChain, GeneSlot } from "./template";
import { GENE_SLOT_LENGTHS, geneSlotForLength, normalizeGeneChain } from "./template";

export type { GeneSlot } from "./template";

export function canEquip(chain: GeneChain, slot: GeneSlot): boolean {
  const normalized = normalizeGeneChain(chain);
  return normalized.targetSlot === slot && normalized.factors.length === GENE_SLOT_LENGTHS[slot];
}

export function slotLabel(slot: GeneSlot): string {
  return slot === "short3" ? "頭墩・3 格" : slot === "long5A" ? "中墩・5 格" : "尾墩・5 格";
}

export function slotForChain(chain: GeneChain): GeneSlot {
  return chain.targetSlot ?? geneSlotForLength(chain.factors.length);
}

export function toggleGeneSlot(chain: GeneChain, index: number): GeneChain {
  const normalized = normalizeGeneChain(chain);
  if (index < 0 || index >= normalized.factors.length) throw new Error("基因格位置無效");
  const enabledSlots = normalized.enabledSlots.map((enabled, slotIndex) => slotIndex === index ? !enabled : enabled);
  return { ...normalized, enabledSlots };
}
