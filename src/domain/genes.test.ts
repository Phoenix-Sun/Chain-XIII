import { describe, expect, it } from "vitest";
import { canEquip, commitFusion, previewFusion } from "./genes";
import type { GeneChain } from "./template";

const chain = (id: string, suits: Array<"water" | "fire" | "wind" | "earth">): GeneChain => ({ id, factors: suits.map((suit) => ({ suit, tier: 1 as const })) });

describe("gene fusion", () => {
  it("fuses equal junction suits and upgrades the junction factor", () => {
    const preview = previewFusion(chain("a", ["water", "fire", "wind"]), chain("b", ["wind", "earth", "water"]), 5);
    expect(preview.joined).toBe("fused");
    expect(preview.factors).toEqual([
      { suit: "water", tier: 1 },
      { suit: "fire", tier: 1 },
      { suit: "wind", tier: 2 },
      { suit: "earth", tier: 1 },
      { suit: "water", tier: 1 },
    ]);
    expect(commitFusion(preview).id).toBe("fusion:a+b");
  });

  it("links different junctions and trims from the front", () => {
    const preview = previewFusion(chain("a", ["water", "fire", "wind"]), chain("b", ["earth", "water", "fire"]), 4);
    expect(preview.joined).toBe("linked");
    expect(preview.removedFromFront).toBe(2);
    expect(preview.factors.map((factor) => factor.suit)).toEqual(["wind", "earth", "water", "fire"]);
  });

  it("enforces the 3/5/5 equipment slots", () => {
    expect(canEquip(chain("short", ["water", "fire", "wind"]), "short3")).toBe(true);
    expect(canEquip(chain("short", ["water", "fire", "wind"]), "long5A")).toBe(false);
  });
});
