import { startingLivesForDifficulty, type RunDifficulty, type RunState } from "./run";
import { skillTreeModifiers } from "./skillTree";
import { normalizeGeneChain, type EquippedGenes, type GeneChain, type GeneSlot } from "./template";
import type { AltarFace, RelicAltarState } from "./relicAltar";

export const CURRENT_SAVE_VERSION = 7;
export const STARTER_CHARACTER_ID = "water-scout";

export interface CharacterProgress { characterId: string; star: 1 | 2 | 3 | 4 | 5; imprintCount: number; }
export interface MetaState { saveVersion: number; crystals: number; characters: CharacterProgress[]; geneInventory: GeneChain[]; relicIds: string[]; unlockedMonsterCodexIds: string[]; permanentSkillNodeIds: string[]; settledRunSeeds: string[]; }
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
    settledRunSeeds: [],
  };
}

export function createSaveEnvelope(meta = createEmptyMeta(), activeRun?: RunState, now = new Date().toISOString()): SaveEnvelope {
  return { saveVersion: CURRENT_SAVE_VERSION, meta: { ...meta, saveVersion: CURRENT_SAVE_VERSION }, activeRun, lastUpdatedAt: now };
}

const VALID_SUITS = new Set(["water", "fire", "wind", "earth"]);

function normalizeGene(value: unknown, fallbackSlot?: GeneSlot): GeneChain | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as { id?: unknown; targetSlot?: unknown; factors?: unknown; enabledSlots?: unknown; name?: unknown; description?: unknown; sourceMonsterId?: unknown };
  if (typeof raw.id !== "string" || !Array.isArray(raw.factors)) return undefined;
  const factors = raw.factors.filter((factor): factor is { suit: GeneChain["factors"][number]["suit"] } => Boolean(factor && typeof factor === "object" && VALID_SUITS.has((factor as { suit?: unknown }).suit as string))).map((factor) => ({ suit: factor.suit }));
  if (factors.length !== 3 && factors.length !== 5) return undefined;
  const targetSlot = raw.targetSlot === "short3" || raw.targetSlot === "long5A" || raw.targetSlot === "long5B" ? raw.targetSlot : fallbackSlot;
  const enabledSlots = Array.isArray(raw.enabledSlots) ? raw.enabledSlots : undefined;
  return normalizeGeneChain({ id: raw.id, targetSlot: targetSlot as GeneSlot, factors, enabledSlots: enabledSlots ? factors.map((_, index) => enabledSlots[index] !== false) : factors.map(() => true), name: typeof raw.name === "string" ? raw.name : undefined, description: typeof raw.description === "string" ? raw.description : undefined, sourceMonsterId: typeof raw.sourceMonsterId === "string" ? raw.sourceMonsterId : undefined }, fallbackSlot);
}

function normalizeGeneInventory(input: unknown): GeneChain[] {
  if (!Array.isArray(input)) return [];
  const byId = new Map<string, GeneChain>();
  input.forEach((value) => {
    const chain = normalizeGene(value);
    if (chain) byId.set(chain.id, chain);
  });
  return [...byId.values()];
}

function normalizeEquippedGenes(input: unknown): EquippedGenes {
  const equipped: EquippedGenes = {};
  if (!input || typeof input !== "object") return equipped;
  (Object.keys({ short3: true, long5A: true, long5B: true }) as GeneSlot[]).forEach((slot) => {
    const chain = normalizeGene((input as Record<string, unknown>)[slot], slot);
    if (chain) equipped[slot] = chain;
  });
  return equipped;
}

export function normalizeAltarState(input: unknown): RelicAltarState | undefined {
  if (!input || typeof input !== "object") return undefined;
  const raw = input as Partial<RelicAltarState>;
  const validFaces = new Set<AltarFace>(["crystal", "relic", "blessing", "skull"]);
  if (typeof raw.seed !== "string" || !Array.isArray(raw.candidateRelicIds) || !Array.isArray(raw.faces) || raw.faces.length !== 5) return undefined;
  const faces = raw.faces.map((face) => face === null || validFaces.has(face as AltarFace) ? face as AltarFace | null : null);
  const status = raw.status === "rolling" || raw.status === "stopped" || raw.status === "bust" ? raw.status : "ready";
  const pendingRewards = raw.pendingRewards && typeof raw.pendingRewards === "object" ? raw.pendingRewards as Partial<RelicAltarState["pendingRewards"]> : {};
  const securedRewards = raw.securedRewards && typeof raw.securedRewards === "object" ? raw.securedRewards as Partial<RelicAltarState["securedRewards"]> : {};
  return {
    seed: raw.seed,
    candidateRelicIds: raw.candidateRelicIds.filter((id): id is string => typeof id === "string"),
    faces,
    lockedSkullIndices: Array.isArray(raw.lockedSkullIndices) ? raw.lockedSkullIndices.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < 5) : [],
    skullCount: typeof raw.skullCount === "number" ? Math.max(0, Math.min(3, Math.floor(raw.skullCount))) : 0,
    graceUsed: raw.graceUsed === true,
    rollCount: typeof raw.rollCount === "number" ? Math.max(0, Math.floor(raw.rollCount)) : 0,
    status,
    pendingRewards: { crystalPairs: typeof pendingRewards.crystalPairs === "number" ? Math.max(0, Math.floor(pendingRewards.crystalPairs)) : 0, blessingCount: typeof pendingRewards.blessingCount === "number" ? Math.max(0, Math.floor(pendingRewards.blessingCount)) : 0, relicReady: pendingRewards.relicReady === true },
    securedRewards: { crystalPairs: typeof securedRewards.crystalPairs === "number" ? Math.max(0, Math.floor(securedRewards.crystalPairs)) : 0, blessingCount: typeof securedRewards.blessingCount === "number" ? Math.max(0, Math.floor(securedRewards.blessingCount)) : 0 },
    protectsSmallRewards: raw.protectsSmallRewards === true,
  };
}

function normalizeExplorationState(input: unknown, nodeIds: Set<string>): RunState["explorationState"] {
  if (!input || typeof input !== "object") return undefined;
  const raw = input as { nodeId?: unknown; eventId?: unknown; attempt?: unknown; result?: unknown; usedTrade?: unknown };
  if (typeof raw.nodeId !== "string" || !nodeIds.has(raw.nodeId) || typeof raw.eventId !== "string") return undefined;
  const result = raw.result && typeof raw.result === "object" ? raw.result as Partial<NonNullable<RunState["explorationState"]>["result"]> : undefined;
  const rolls = result && Array.isArray(result.rolls) && result.rolls.length === 3 && result.rolls.every((roll) => Number.isInteger(roll) && roll >= 1 && roll <= 6) ? result.rolls : undefined;
  const safeResult = rolls && result && typeof result.total === "number" && Number.isFinite(result.total) && typeof result.hasPair === "boolean" && typeof result.isStraight === "boolean" && typeof result.success === "boolean"
    ? { rolls, total: result.total, hasPair: result.hasPair, isStraight: result.isStraight, success: result.success }
    : undefined;
  return { nodeId: raw.nodeId, eventId: raw.eventId, attempt: typeof raw.attempt === "number" && Number.isFinite(raw.attempt) ? Math.max(0, Math.floor(raw.attempt)) : 0, result: safeResult, usedTrade: raw.usedTrade === true };
}

function normalizeBattleState(input: unknown, nodeIds: Set<string>): RunState["battleState"] {
  if (!input || typeof input !== "object") return undefined;
  const raw = input as { nodeId?: unknown; drawAttempt?: unknown; frontBonus?: unknown; laneElementOverrides?: unknown };
  if (typeof raw.nodeId !== "string" || !nodeIds.has(raw.nodeId)) return undefined;
  const laneElementOverrides: NonNullable<RunState["battleState"]>["laneElementOverrides"] = {};
  if (raw.laneElementOverrides && typeof raw.laneElementOverrides === "object") {
    (Object.keys(raw.laneElementOverrides) as Array<keyof typeof laneElementOverrides>).forEach((lane) => {
      const suit = (raw.laneElementOverrides as Record<string, unknown>)[lane];
      if ((lane === "front" || lane === "middle" || lane === "back") && typeof suit === "string" && VALID_SUITS.has(suit)) laneElementOverrides[lane] = suit as "water" | "fire" | "wind" | "earth";
    });
  }
  return { nodeId: raw.nodeId, drawAttempt: typeof raw.drawAttempt === "number" && Number.isFinite(raw.drawAttempt) ? Math.max(0, Math.floor(raw.drawAttempt)) : 0, frontBonus: typeof raw.frontBonus === "number" && Number.isFinite(raw.frontBonus) ? raw.frontBonus : 0, laneElementOverrides };
}

export function mergeRunIntoMeta(meta: MetaState, run: RunState): MetaState {
  if (meta.settledRunSeeds.includes(run.seed)) return meta;
  const completedMonsterIds = run.map.nodes.filter((node) => node.id !== run.map.startNodeId && run.completedNodeIds.includes(node.id) && node.monsterId).map((node) => node.monsterId!);
  const geneById = new Map([...meta.geneInventory, ...run.geneInventory].map((chain) => [chain.id, chain]));
  const earnedCrystals = Math.max(0, run.earnedCrystals - Math.max(0, run.startingCrystals ?? 0));
  const completedPartyIds = run.status === "won" ? new Set(run.partyCharacterIds) : new Set<string>();
  return {
    ...meta,
    crystals: meta.crystals + earnedCrystals,
    characters: meta.characters.map((character) => completedPartyIds.has(character.characterId) ? { ...character, imprintCount: character.imprintCount + 1 } : character),
    geneInventory: [...geneById.values()],
    relicIds: [...new Set([...meta.relicIds, ...run.relicIds])],
    unlockedMonsterCodexIds: [...new Set([...meta.unlockedMonsterCodexIds, ...completedMonsterIds])],
    settledRunSeeds: [...meta.settledRunSeeds, run.seed],
  };
}

function migrateActiveRun(input: unknown): RunState | undefined {
  if (input === undefined) return undefined;
  if (!input || typeof input !== "object") throw new Error("Save activeRun 欄位無效");
  const raw = input as Partial<RunState>;
  const rawMap = raw.map;
  if (typeof raw.seed !== "string" || !rawMap || !Array.isArray(rawMap.nodes) || typeof rawMap.startNodeId !== "string" || typeof rawMap.bossNodeId !== "string") throw new Error("Save activeRun 基本欄位無效");
  const legacyMap = rawMap as typeof rawMap & { chapterBossNodeIds?: unknown };
  const map = {
    ...rawMap,
    chapterEndNodeIds: Array.isArray(rawMap.chapterEndNodeIds) && rawMap.chapterEndNodeIds.length > 0 ? rawMap.chapterEndNodeIds : Array.isArray(legacyMap.chapterBossNodeIds) && legacyMap.chapterBossNodeIds.length > 0 ? legacyMap.chapterBossNodeIds : [rawMap.bossNodeId],
    chapterLengths: Array.isArray(rawMap.chapterLengths) && rawMap.chapterLengths.length === 3 ? rawMap.chapterLengths as [number, number, number] : [rawMap.nodes.length, 0, 0] as [number, number, number],
  };
  const validNodeId = (value: unknown, fallback: string) => typeof value === "string" && map.nodes.some((node) => node.id === value) ? value : fallback;
  const difficulty: RunDifficulty = raw.difficulty === "easy" || raw.difficulty === "hard" ? raw.difficulty : "normal";
  const maxLives = startingLivesForDifficulty(difficulty);
  const livesRemaining = typeof raw.livesRemaining === "number" ? Math.min(maxLives, Math.max(0, Math.floor(raw.livesRemaining))) : maxLives;
  const currentNodeId = validNodeId(raw.currentNodeId, map.startNodeId);
  const discoveredRunFlags = (Array.isArray(raw.discoveredRunFlags) ? raw.discoveredRunFlags : []).map((flag) => flag === "route:next-layer-revealed" ? `route:next-layer-revealed:${currentNodeId}` : flag);
  const permanentSkillNodeIds = Array.isArray(raw.permanentSkillNodeIds) ? raw.permanentSkillNodeIds.filter((id): id is string => typeof id === "string") : [];
  const startingCrystals = typeof raw.startingCrystals === "number" && Number.isFinite(raw.startingCrystals) && raw.startingCrystals >= 0 ? raw.startingCrystals : skillTreeModifiers(permanentSkillNodeIds).startingCrystals;
  const explorationState = normalizeExplorationState(raw.explorationState, new Set(map.nodes.map((node) => node.id)));
  const rawPendingChoice = raw.pendingRewardChoice;
  const pendingRewardChoice = rawPendingChoice && typeof rawPendingChoice === "object" && typeof rawPendingChoice.nodeId === "string" && rawPendingChoice.nodeId === currentNodeId && typeof rawPendingChoice.choiceId === "string"
    ? { nodeId: rawPendingChoice.nodeId, choiceId: rawPendingChoice.choiceId }
    : undefined;
  const battleState = normalizeBattleState(raw.battleState, new Set(map.nodes.map((node) => node.id)));
  const endReason = raw.endReason === "victory" ? "victory" : raw.endReason === "abandoned" ? "abandoned" : raw.endReason === "defeat" ? "defeat" : raw.status === "won" ? "victory" : raw.status === "lost" && livesRemaining === 0 ? "defeat" : raw.status === "lost" ? "abandoned" : undefined;
  return {
    seed: raw.seed,
    partyCharacterIds: Array.isArray(raw.partyCharacterIds) && raw.partyCharacterIds.length > 0 ? raw.partyCharacterIds : [STARTER_CHARACTER_ID],
    difficulty,
    maxLives,
    livesRemaining,
    map,
    geneInventory: normalizeGeneInventory(raw.geneInventory),
    geneCapacity: typeof raw.geneCapacity === "number" ? raw.geneCapacity : 6,
    equippedGenes: normalizeEquippedGenes(raw.equippedGenes),
    relicIds: Array.isArray(raw.relicIds) ? raw.relicIds : [],
    blessingIds: Array.isArray(raw.blessingIds) ? raw.blessingIds : [],
    nextBattleSkullCurse: typeof raw.nextBattleSkullCurse === "number" ? Math.max(0, Math.floor(raw.nextBattleSkullCurse)) : 0,
    altarState: normalizeAltarState(raw.altarState),
    explorationState: explorationState?.nodeId === currentNodeId ? explorationState : undefined,
    pendingRewardChoice,
    battleState: battleState?.nodeId === currentNodeId ? battleState : undefined,
    permanentSkillNodeIds,
    discoveredRunFlags,
    completedNodeIds: Array.isArray(raw.completedNodeIds) ? raw.completedNodeIds : [map.startNodeId],
    claimedRewardNodeIds: Array.isArray(raw.claimedRewardNodeIds) ? raw.claimedRewardNodeIds : [],
    startingCrystals,
    earnedCrystals: typeof raw.earnedCrystals === "number" ? raw.earnedCrystals : 0,
    earnedGeneChainIds: Array.isArray(raw.earnedGeneChainIds) ? raw.earnedGeneChainIds : [],
    currentNodeId,
    finalBossId: validNodeId(raw.finalBossId, map.bossNodeId),
    status: raw.status === "won" ? "won" : raw.status === "lost" || livesRemaining === 0 ? "lost" : "active",
    endReason,
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
  if (raw.saveVersion !== 1 && raw.saveVersion !== 2 && raw.saveVersion !== 3 && raw.saveVersion !== 4 && raw.saveVersion !== 5 && raw.saveVersion !== 6 && raw.saveVersion !== CURRENT_SAVE_VERSION) throw new Error(`不支援的 saveVersion: ${String(raw.saveVersion)}`);
  if (!raw.meta || typeof raw.meta !== "object") throw new Error("Save 缺少 meta");
  const meta = raw.meta as Partial<MetaState>;
  if (!Array.isArray(meta.unlockedMonsterCodexIds) || !Array.isArray(meta.permanentSkillNodeIds)) throw new Error("Save meta 欄位無效");
  if (typeof meta.crystals !== "number" || !Number.isFinite(meta.crystals) || meta.crystals < 0 || typeof raw.lastUpdatedAt !== "string") throw new Error("Save 基本欄位無效");
  const characters = normalizeCharacters(meta.characters);
  const ownedIds = new Set(characters.map((character) => character.characterId));
  const activeRun = migrateActiveRun(raw.activeRun);
  const safeRun = activeRun ? { ...activeRun, partyCharacterIds: activeRun.partyCharacterIds.filter((characterId) => ownedIds.has(characterId)).slice(0, 3) } : undefined;
  return { saveVersion: CURRENT_SAVE_VERSION, meta: { saveVersion: CURRENT_SAVE_VERSION, crystals: meta.crystals, characters, geneInventory: normalizeGeneInventory(meta.geneInventory), relicIds: Array.isArray(meta.relicIds) ? meta.relicIds : [], unlockedMonsterCodexIds: meta.unlockedMonsterCodexIds, permanentSkillNodeIds: meta.permanentSkillNodeIds, settledRunSeeds: Array.isArray(meta.settledRunSeeds) ? meta.settledRunSeeds.filter((seed): seed is string => typeof seed === "string") : [] }, activeRun: safeRun && safeRun.partyCharacterIds.length > 0 ? safeRun : safeRun ? { ...safeRun, partyCharacterIds: [characters[0].characterId] } : undefined, lastUpdatedAt: raw.lastUpdatedAt };
}

export function parseSave(serialized: string): SaveEnvelope { return migrateSave(JSON.parse(serialized) as unknown); }
