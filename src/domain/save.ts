import { startingLivesForDifficulty, type RunDifficulty, type RunState } from "./run";
import type { GeneChain } from "./template";

export const CURRENT_SAVE_VERSION = 4;
export const STARTER_CHARACTER_ID = "water-scout";

export interface CharacterProgress { characterId: string; star: 1 | 2 | 3 | 4 | 5; imprintCount: number; }
export interface MetaState { saveVersion: number; crystals: number; characters: CharacterProgress[]; geneInventory: GeneChain[]; relicIds: string[]; unlockedMonsterCodexIds: string[]; permanentSkillNodeIds: string[]; }
export interface SaveEnvelope { saveVersion: number; meta: MetaState; activeRun?: RunState; lastUpdatedAt: string; }

export function createEmptyMeta(): MetaState {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    crystals: 0,
    characters: [{ characterId: STARTER_CHARACTER_ID, star: 1, imprintCount: 0 }],
    geneInventory: [],
    relicIds: [],
    unlockedMonsterCodexIds: [],
    permanentSkillNodeIds: [],
  };
}

export function createSaveEnvelope(meta = createEmptyMeta(), activeRun?: RunState, now = new Date().toISOString()): SaveEnvelope {
  return { saveVersion: CURRENT_SAVE_VERSION, meta: { ...meta, saveVersion: CURRENT_SAVE_VERSION }, activeRun, lastUpdatedAt: now };
}

export function mergeRunIntoMeta(meta: MetaState, run: RunState): MetaState {
  const completedMonsterIds = run.map.nodes.filter((node) => run.completedNodeIds.includes(node.id) && node.monsterId).map((node) => node.monsterId!);
  const geneById = new Map([...meta.geneInventory, ...run.geneInventory].map((chain) => [chain.id, chain]));
  return {
    ...meta,
    crystals: meta.crystals + run.earnedCrystals,
    geneInventory: [...geneById.values()],
    relicIds: [...new Set([...meta.relicIds, ...run.relicIds])],
    unlockedMonsterCodexIds: [...new Set([...meta.unlockedMonsterCodexIds, ...completedMonsterIds])],
  };
}

function migrateActiveRun(input: unknown): RunState | undefined {
  if (input === undefined) return undefined;
  if (!input || typeof input !== "object") throw new Error("Save activeRun 欄位無效");
  const raw = input as Partial<RunState>;
  const rawMap = raw.map;
  if (typeof raw.seed !== "string" || !rawMap || !Array.isArray(rawMap.nodes) || typeof rawMap.startNodeId !== "string" || typeof rawMap.bossNodeId !== "string") throw new Error("Save activeRun 基本欄位無效");
  const map = {
    ...rawMap,
    chapterBossNodeIds: Array.isArray(rawMap.chapterBossNodeIds) && rawMap.chapterBossNodeIds.length > 0 ? rawMap.chapterBossNodeIds : [rawMap.bossNodeId],
    chapterLengths: Array.isArray(rawMap.chapterLengths) && rawMap.chapterLengths.length === 3 ? rawMap.chapterLengths as [number, number, number] : [rawMap.nodes.length, 0, 0] as [number, number, number],
  };
  const validNodeId = (value: unknown, fallback: string) => typeof value === "string" && map.nodes.some((node) => node.id === value) ? value : fallback;
  const difficulty: RunDifficulty = raw.difficulty === "easy" || raw.difficulty === "hard" ? raw.difficulty : "normal";
  const maxLives = startingLivesForDifficulty(difficulty);
  const livesRemaining = typeof raw.livesRemaining === "number" ? Math.min(maxLives, Math.max(0, Math.floor(raw.livesRemaining))) : maxLives;
  return {
    seed: raw.seed,
    partyCharacterIds: Array.isArray(raw.partyCharacterIds) && raw.partyCharacterIds.length > 0 ? raw.partyCharacterIds : [STARTER_CHARACTER_ID],
    difficulty,
    maxLives,
    livesRemaining,
    map,
    geneInventory: Array.isArray(raw.geneInventory) ? raw.geneInventory : [],
    geneCapacity: typeof raw.geneCapacity === "number" ? raw.geneCapacity : 6,
    equippedGenes: raw.equippedGenes && typeof raw.equippedGenes === "object" ? raw.equippedGenes : {},
    relicIds: Array.isArray(raw.relicIds) ? raw.relicIds : [],
    permanentSkillNodeIds: Array.isArray(raw.permanentSkillNodeIds) ? raw.permanentSkillNodeIds : [],
    discoveredRunFlags: Array.isArray(raw.discoveredRunFlags) ? raw.discoveredRunFlags : [],
    completedNodeIds: Array.isArray(raw.completedNodeIds) ? raw.completedNodeIds : [map.startNodeId],
    claimedRewardNodeIds: Array.isArray(raw.claimedRewardNodeIds) ? raw.claimedRewardNodeIds : [],
    earnedCrystals: typeof raw.earnedCrystals === "number" ? raw.earnedCrystals : 0,
    earnedGeneChainIds: Array.isArray(raw.earnedGeneChainIds) ? raw.earnedGeneChainIds : [],
    currentNodeId: validNodeId(raw.currentNodeId, map.startNodeId),
    finalBossId: validNodeId(raw.finalBossId, map.bossNodeId),
    status: raw.status === "won" ? "won" : raw.status === "lost" || livesRemaining === 0 ? "lost" : "active",
  };
}

export function serializeSave(save: SaveEnvelope): string { return JSON.stringify(save); }

function normalizeCharacters(input: unknown): CharacterProgress[] {
  const characters = Array.isArray(input) ? input.filter((character): character is CharacterProgress => Boolean(character && typeof character === "object" && typeof (character as CharacterProgress).characterId === "string" && [1, 2, 3, 4, 5].includes((character as CharacterProgress).star) && typeof (character as CharacterProgress).imprintCount === "number")) : [];
  const byId = new Map(characters.map((character) => [character.characterId, character]));
  if (!byId.has(STARTER_CHARACTER_ID)) byId.set(STARTER_CHARACTER_ID, { characterId: STARTER_CHARACTER_ID, star: 1, imprintCount: 0 });
  return [...byId.values()];
}

export function migrateSave(input: unknown): SaveEnvelope {
  if (!input || typeof input !== "object") throw new Error("Save 格式無效");
  const raw = input as Partial<SaveEnvelope>;
  if (raw.saveVersion !== 1 && raw.saveVersion !== 2 && raw.saveVersion !== 3 && raw.saveVersion !== CURRENT_SAVE_VERSION) throw new Error(`不支援的 saveVersion: ${String(raw.saveVersion)}`);
  if (!raw.meta || typeof raw.meta !== "object") throw new Error("Save 缺少 meta");
  const meta = raw.meta as Partial<MetaState>;
  if (!Array.isArray(meta.unlockedMonsterCodexIds) || !Array.isArray(meta.permanentSkillNodeIds)) throw new Error("Save meta 欄位無效");
  if (typeof meta.crystals !== "number" || !Number.isFinite(meta.crystals) || meta.crystals < 0 || typeof raw.lastUpdatedAt !== "string") throw new Error("Save 基本欄位無效");
  const characters = normalizeCharacters(meta.characters);
  const ownedIds = new Set(characters.map((character) => character.characterId));
  const activeRun = migrateActiveRun(raw.activeRun);
  const safeRun = activeRun ? { ...activeRun, partyCharacterIds: activeRun.partyCharacterIds.filter((characterId) => ownedIds.has(characterId)).slice(0, 3) } : undefined;
  return { saveVersion: CURRENT_SAVE_VERSION, meta: { saveVersion: CURRENT_SAVE_VERSION, crystals: meta.crystals, characters, geneInventory: Array.isArray(meta.geneInventory) ? meta.geneInventory as GeneChain[] : [], relicIds: Array.isArray(meta.relicIds) ? meta.relicIds : [], unlockedMonsterCodexIds: meta.unlockedMonsterCodexIds, permanentSkillNodeIds: meta.permanentSkillNodeIds }, activeRun: safeRun && safeRun.partyCharacterIds.length > 0 ? safeRun : safeRun ? { ...safeRun, partyCharacterIds: [characters[0].characterId] } : undefined, lastUpdatedAt: raw.lastUpdatedAt };
}

export function parseSave(serialized: string): SaveEnvelope { return migrateSave(JSON.parse(serialized) as unknown); }
