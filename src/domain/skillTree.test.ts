import { describe, expect, it } from "vitest";
import { createEmptyMeta } from "./save";
import { createRunState } from "./run";
import { buySkillNode, getSkillNode, skillNodes, skillTreeModifiers } from "./skillTree";

describe("permanent skill tree", () => {
  it("buys an available node and spends crystals", () => {
    const meta = { ...createEmptyMeta(), crystals: 100 };
    const upgraded = buySkillNode(meta, "expanded-satchel");

    expect(upgraded.crystals).toBe(20);
    expect(upgraded.permanentSkillNodeIds).toEqual(["expanded-satchel"]);
  });

  it("requires prerequisites and prevents duplicate purchases", () => {
    const meta = { ...createEmptyMeta(), crystals: 500 };

    expect(() => buySkillNode(meta, "route-network")).toThrow("需要先解鎖：expanded-satchel");
    const first = buySkillNode(meta, "expanded-satchel");
    const second = buySkillNode(first, "route-network");
    expect(second.permanentSkillNodeIds).toEqual(["expanded-satchel", "route-network"]);
    expect(() => buySkillNode(second, "expanded-satchel")).toThrow("已經解鎖");
  });

  it("turns permanent nodes into concrete Run modifiers", () => {
    const modifiers = skillTreeModifiers(["expanded-satchel", "opening-drill", "route-network"]);
    const run = createRunState("skill-run", ["water-scout"], [], ["expanded-satchel", "opening-drill", "route-network"]);

    expect(modifiers).toEqual({ geneCapacityBonus: 2, frontBonus: 1, startingCrystals: 5 });
    expect(run.geneCapacity).toBe(8);
    expect(run.earnedCrystals).toBe(5);
    expect(getSkillNode("opening-drill")).toEqual(skillNodes.find((node) => node.id === "opening-drill"));
  });
});
