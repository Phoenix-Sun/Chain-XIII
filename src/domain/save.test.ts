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

  it("round trips difficulty and remaining lives for an active Run", () => {
    const run = createRunState("difficulty-save", [STARTER_CHARACTER_ID], [], [], "hard");
    const wounded = { ...run, livesRemaining: 0, status: "lost" as const };
    expect(parseSave(serializeSave(createSaveEnvelope(createEmptyMeta(), wounded))).activeRun).toMatchObject({ difficulty: "hard", maxLives: 1, livesRemaining: 0, status: "lost" });
  });

  it("migrates version 1 metadata with empty progression collections", () => {
    const migrated = parseSave(JSON.stringify({ saveVersion: 1, meta: { saveVersion: 1, crystals: 20, characters: createEmptyMeta().characters, unlockedMonsterCodexIds: [], permanentSkillNodeIds: [] }, lastUpdatedAt: "now" }));
    expect(migrated.saveVersion).toBe(7);
    expect(migrated.meta.geneInventory).toEqual([]);
    expect(migrated.meta.relicIds).toEqual([]);
  });

  it("migrates legacy tiered genes into fixed patterns with all slots enabled", () => {
    const migrated = parseSave(JSON.stringify({ saveVersion: 5, meta: { saveVersion: 5, crystals: 0, characters: createEmptyMeta().characters, geneInventory: [{ id: "legacy-chain", factors: [{ suit: "water", tier: 3 }, { suit: "fire", tier: 2 }, { suit: "wind", tier: 1 }] }], unlockedMonsterCodexIds: [], permanentSkillNodeIds: [] }, lastUpdatedAt: "now" }));
    expect(migrated.meta.geneInventory[0]).toMatchObject({ id: "legacy-chain", targetSlot: "short3", enabledSlots: [true, true, true], factors: [{ suit: "water" }, { suit: "fire" }, { suit: "wind" }] });
    expect(migrated.meta.geneInventory[0].factors[0]).not.toHaveProperty("tier");
  });

  it("fills defaults for a version 1 active Run instead of returning an unsafe partial object", () => {
    const run = createRunState("legacy-run", [STARTER_CHARACTER_ID]);
    const legacyRun = { seed: run.seed, partyCharacterIds: run.partyCharacterIds, map: run.map, currentNodeId: run.currentNodeId, finalBossId: run.finalBossId };
    const migrated = parseSave(JSON.stringify({ saveVersion: 1, meta: { saveVersion: 1, crystals: 0, characters: createEmptyMeta().characters, unlockedMonsterCodexIds: [], permanentSkillNodeIds: [] }, activeRun: legacyRun, lastUpdatedAt: "now" }));
    expect(migrated.activeRun?.completedNodeIds).toEqual([run.map.startNodeId]);
    expect(migrated.activeRun?.claimedRewardNodeIds).toEqual([]);
    expect(migrated.activeRun?.earnedCrystals).toBe(0);
  });

  it("adds chapter map metadata when resuming a legacy active Run", () => {
    const run = createRunState("legacy-map", [STARTER_CHARACTER_ID]);
    const { chapterEndNodeIds: _chapterEndNodeIds, chapterLengths: _chapterLengths, ...legacyMap } = run.map;
    const migrated = parseSave(JSON.stringify({ saveVersion: 4, meta: { saveVersion: 4, crystals: 0, characters: createEmptyMeta().characters, unlockedMonsterCodexIds: [], permanentSkillNodeIds: [] }, activeRun: { ...run, map: { ...legacyMap, chapterBossNodeIds: [run.map.bossNodeId] } }, lastUpdatedAt: "now" }));
    expect(migrated.activeRun?.map.chapterEndNodeIds).toEqual([run.map.bossNodeId]);
    expect(migrated.activeRun?.map.chapterLengths).toEqual([run.map.nodes.length, 0, 0]);
  });

  it("scopes legacy route intelligence to the node where it was purchased", () => {
    const run = createRunState("legacy-route-info", [STARTER_CHARACTER_ID]);
    const migrated = parseSave(JSON.stringify({ saveVersion: 6, meta: { saveVersion: 6, crystals: 0, characters: createEmptyMeta().characters, unlockedMonsterCodexIds: [], permanentSkillNodeIds: [] }, activeRun: { ...run, discoveredRunFlags: ["route:next-layer-revealed"] }, lastUpdatedAt: "now" }));
    expect(migrated.activeRun?.discoveredRunFlags).toContain(`route:next-layer-revealed:${run.currentNodeId}`);
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
    const settled = { ...run, completedNodeIds: [run.map.startNodeId, monsterNode.id], earnedCrystals: 25, geneInventory: [{ id: "gene-test", targetSlot: "short3" as const, factors: [{ suit: "water" as const }, { suit: "fire" as const }, { suit: "wind" as const }], enabledSlots: [true, true, true] }], relicIds: ["relic-1"] };
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
