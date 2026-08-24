import type { RunState } from "./run";

export const CURRENT_SAVE_VERSION = 1;

export interface CharacterProgress { characterId: string; star: 1 | 2 | 3 | 4 | 5; imprintCount: number; }
export interface MetaState { saveVersion: number; crystals: number; characters: CharacterProgress[]; unlockedMonsterCodexIds: string[]; permanentSkillNodeIds: string[]; }
export interface SaveEnvelope { saveVersion: number; meta: MetaState; activeRun?: RunState; lastUpdatedAt: string; }

export function createEmptyMeta(): MetaState {
  return { saveVersion: CURRENT_SAVE_VERSION, crystals: 0, characters: [], unlockedMonsterCodexIds: [], permanentSkillNodeIds: [] };
}

export function createSaveEnvelope(meta = createEmptyMeta(), activeRun?: RunState, now = new Date().toISOString()): SaveEnvelope {
  return { saveVersion: CURRENT_SAVE_VERSION, meta: { ...meta, saveVersion: CURRENT_SAVE_VERSION }, activeRun, lastUpdatedAt: now };
}

export function serializeSave(save: SaveEnvelope): string { return JSON.stringify(save); }

export function migrateSave(input: unknown): SaveEnvelope {
  if (!input || typeof input !== "object") throw new Error("Save 格式無效");
  const raw = input as Partial<SaveEnvelope>;
  if (raw.saveVersion !== CURRENT_SAVE_VERSION) throw new Error(`不支援的 saveVersion: ${String(raw.saveVersion)}`);
  if (!raw.meta || typeof raw.meta !== "object") throw new Error("Save 缺少 meta");
  const meta = raw.meta as Partial<MetaState>;
  if (!Array.isArray(meta.characters) || !Array.isArray(meta.unlockedMonsterCodexIds) || !Array.isArray(meta.permanentSkillNodeIds)) throw new Error("Save meta 欄位無效");
  if (typeof meta.crystals !== "number" || typeof raw.lastUpdatedAt !== "string") throw new Error("Save 基本欄位無效");
  return { saveVersion: CURRENT_SAVE_VERSION, meta: { saveVersion: CURRENT_SAVE_VERSION, crystals: meta.crystals, characters: meta.characters as CharacterProgress[], unlockedMonsterCodexIds: meta.unlockedMonsterCodexIds, permanentSkillNodeIds: meta.permanentSkillNodeIds }, activeRun: raw.activeRun, lastUpdatedAt: raw.lastUpdatedAt };
}

export function parseSave(serialized: string): SaveEnvelope { return migrateSave(JSON.parse(serialized) as unknown); }
