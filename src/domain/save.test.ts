import { describe, expect, it } from "vitest";
import { createEmptyMeta, createSaveEnvelope, mergeRunIntoMeta, parseSave, serializeSave, STARTER_CHARACTER_ID } from "./save";
import { createRunState } from "./run";

describe("versioned save envelope", () => {
  it("round trips through JSON without UI state", () => {
    const save = createSaveEnvelope(createEmptyMeta(), undefined, "2026-08-24T00:00:00.000Z");
    expect(parseSave(serializeSave(save))).toEqual(save);
  });

  it("starts a new account with the guaranteed starter character", () => {
    expect(createEmptyMeta().characters).toEqual([{ characterId: STARTER_CHARACTER_ID, star: 1, imprintCount: 0 }]);
  });

  it("round trips an active Run for resume", () => {
    const save = createSaveEnvelope(createEmptyMeta(), createRunState("resume-seed", [STARTER_CHARACTER_ID]), "2026-08-25T00:00:00.000Z");
    expect(parseSave(serializeSave(save)).activeRun?.seed).toBe("resume-seed");
  });

  it("migrates version 1 metadata with empty progression collections", () => {
    const migrated = parseSave(JSON.stringify({ saveVersion: 1, meta: { saveVersion: 1, crystals: 20, characters: createEmptyMeta().characters, unlockedMonsterCodexIds: [], permanentSkillNodeIds: [] }, lastUpdatedAt: "now" }));
    expect(migrated.saveVersion).toBe(2);
    expect(migrated.meta.geneInventory).toEqual([]);
    expect(migrated.meta.relicIds).toEqual([]);
  });

  it("fills defaults for a version 1 active Run instead of returning an unsafe partial object", () => {
    const run = createRunState("legacy-run", [STARTER_CHARACTER_ID]);
    const legacyRun = { seed: run.seed, partyCharacterIds: run.partyCharacterIds, map: run.map, currentNodeId: run.currentNodeId, finalBossId: run.finalBossId };
    const migrated = parseSave(JSON.stringify({ saveVersion: 1, meta: { saveVersion: 1, crystals: 0, characters: createEmptyMeta().characters, unlockedMonsterCodexIds: [], permanentSkillNodeIds: [] }, activeRun: legacyRun, lastUpdatedAt: "now" }));
    expect(migrated.activeRun?.completedNodeIds).toEqual([run.map.startNodeId]);
    expect(migrated.activeRun?.claimedRewardNodeIds).toEqual([]);
    expect(migrated.activeRun?.earnedCrystals).toBe(0);
  });

  it("restores the starter and removes unknown saved party members during migration", () => {
    const run = createRunState("legacy-party", [STARTER_CHARACTER_ID]);
    const migrated = parseSave(JSON.stringify({ saveVersion: 1, meta: { saveVersion: 1, crystals: 0, characters: [], unlockedMonsterCodexIds: [], permanentSkillNodeIds: [] }, activeRun: { ...run, partyCharacterIds: ["missing-character"] }, lastUpdatedAt: "now" }));
    expect(migrated.meta.characters[0].characterId).toBe(STARTER_CHARACTER_ID);
    expect(migrated.activeRun?.partyCharacterIds).toEqual([STARTER_CHARACTER_ID]);
  });

  it("merges a settled Run into permanent Meta collections exactly once", () => {
    const run = createRunState("settle-seed", [STARTER_CHARACTER_ID]);
    const monsterNode = run.map.nodes.find((node) => node.monsterId)!;
    const settled = { ...run, completedNodeIds: [run.map.startNodeId, monsterNode.id], earnedCrystals: 25, geneInventory: [{ id: "gene-test", factors: [{ suit: "water" as const, tier: 1 as const }, { suit: "fire" as const, tier: 1 as const }, { suit: "wind" as const, tier: 1 as const }] }], relicIds: ["relic-1"] };
    const meta = mergeRunIntoMeta(createEmptyMeta(), settled);
    expect(meta.crystals).toBe(25);
    expect(meta.geneInventory.map((chain) => chain.id)).toEqual(["gene-test"]);
    expect(meta.relicIds).toEqual(["relic-1"]);
    expect(meta.unlockedMonsterCodexIds).toContain(monsterNode.monsterId);
  });

  it("rejects unknown versions and malformed metadata", () => {
    expect(() => parseSave(JSON.stringify({ saveVersion: 99 }))).toThrow("不支援的 saveVersion");
    expect(() => parseSave(JSON.stringify({ saveVersion: 1, meta: {}, lastUpdatedAt: "now" }))).toThrow("Save meta 欄位無效");
  });
});
