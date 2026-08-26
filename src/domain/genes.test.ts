import { describe, expect, it } from "vitest";
import { canEquip, slotForChain, toggleGeneSlot } from "./genes";
import type { GeneChain } from "./template";

const chain = (id: string, targetSlot: GeneChain["targetSlot"], suits: Array<"water" | "fire" | "wind" | "earth">): GeneChain => ({ id, targetSlot, factors: suits.map((suit) => ({ suit })), enabledSlots: suits.map(() => true) });

describe("visual gene patterns", () => {
  it("keeps the dropped lane and pattern fixed", () => {
    const dropped = chain("a", "long5B", ["fire", "water", "water", "fire", "fire"]);
    expect(slotForChain(dropped)).toBe("long5B");
    expect(dropped.factors.map((factor) => factor.suit)).toEqual(["fire", "water", "water", "fire", "fire"]);
  });

  it("toggles any element slot without changing the fixed pattern", () => {
    const toggled = toggleGeneSlot(chain("a", "long5B", ["fire", "water", "water", "fire", "fire"]), 0);
    expect(toggled.enabledSlots).toEqual([false, true, true, true, true]);
    expect(toggled.factors.map((factor) => factor.suit)).toEqual(["fire", "water", "water", "fire", "fire"]);
  });

  it("enforces the dropped 3/5/5 lane", () => {
    expect(canEquip(chain("short", "short3", ["water", "fire", "wind"]), "short3")).toBe(true);
    expect(canEquip(chain("short", "short3", ["water", "fire", "wind"]), "long5A")).toBe(false);
  });
});
