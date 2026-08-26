import { SeededRandom } from "./random";

export type AltarFace = "crystal" | "relic" | "blessing" | "skull";
export type RelicAltarStatus = "ready" | "rolling" | "stopped" | "bust";

export const ALTAR_DIE_FACES: readonly AltarFace[] = ["crystal", "crystal", "relic", "blessing", "blessing", "skull"];
export const ALTAR_DICE_COUNT = 5;
export const ALTAR_BUST_SKULLS = 3;
export const ALTAR_CRYSTALS_PER_PAIR = 8;

export interface AltarRewardPreview {
  crystalPairs: number;
  blessingCount: number;
  relicReady: boolean;
}

export interface RelicAltarState {
  seed: string;
  candidateRelicIds: string[];
  faces: Array<AltarFace | null>;
  lockedSkullIndices: number[];
  skullCount: number;
  graceUsed: boolean;
  rollCount: number;
  status: RelicAltarStatus;
  pendingRewards: AltarRewardPreview;
  securedRewards: { crystalPairs: number; blessingCount: number };
  protectsSmallRewards: boolean;
}

export interface AltarSettlement {
  status: "stopped" | "bust";
  crystalPairs: number;
  blessingCount: number;
  relicReady: boolean;
  nextBattleSkullCurse: number;
}

export function createRelicAltarState(seed: string, candidateRelicIds: string[], protectsSmallRewards = false): RelicAltarState {
  return {
    seed,
    candidateRelicIds: [...candidateRelicIds],
    faces: Array.from({ length: ALTAR_DICE_COUNT }, () => null),
    lockedSkullIndices: [],
    skullCount: 0,
    graceUsed: false,
    rollCount: 0,
    status: "ready",
    pendingRewards: { crystalPairs: 0, blessingCount: 0, relicReady: false },
    securedRewards: { crystalPairs: 0, blessingCount: 0 },
    protectsSmallRewards,
  };
}

export function altarRewardPreview(faces: Array<AltarFace | null>): AltarRewardPreview {
  const count = (face: AltarFace) => faces.filter((value) => value === face).length;
  return {
    crystalPairs: Math.floor(count("crystal") / 2),
    blessingCount: Math.floor(count("blessing") / 2),
    relicReady: count("relic") >= 3,
  };
}

function rollFace(seed: string, rollCount: number, index: number): AltarFace {
  return ALTAR_DIE_FACES[new SeededRandom(`${seed}:roll:${rollCount}:${index}`).int(ALTAR_DIE_FACES.length)];
}

function finishRoll(state: RelicAltarState, faces: Array<AltarFace | null>, lockedSkullIndices: number[], skullCount: number, graceUsed: boolean): RelicAltarState {
  const pendingRewards = altarRewardPreview(faces);
  const securedRewards = state.protectsSmallRewards ? {
    crystalPairs: Math.max(state.securedRewards.crystalPairs, pendingRewards.crystalPairs),
    blessingCount: Math.max(state.securedRewards.blessingCount, pendingRewards.blessingCount),
  } : { crystalPairs: 0, blessingCount: 0 };
  return {
    ...state,
    faces,
    lockedSkullIndices,
    skullCount,
    graceUsed,
    rollCount: state.rollCount + 1,
    status: skullCount >= ALTAR_BUST_SKULLS ? "bust" : "rolling",
    pendingRewards,
    securedRewards,
  };
}

export function rollAltar(state: RelicAltarState, selectedIndices: number[] = [], ignoreFirstSkull = false): RelicAltarState {
  if (state.status === "bust" || state.status === "stopped") return state;
  const selected = new Set(selectedIndices);
  const firstRoll = state.rollCount === 0;
  const faces = state.faces.map((face, index) => firstRoll || (selected.has(index) && !state.lockedSkullIndices.includes(index)) ? rollFace(state.seed, state.rollCount, index) : face);
  const lockedSkullIndices = [...state.lockedSkullIndices];
  let skullCount = state.skullCount;
  let graceUsed = state.graceUsed;
  faces.forEach((face, index) => {
    if (face !== "skull" || lockedSkullIndices.includes(index)) return;
    lockedSkullIndices.push(index);
    if (ignoreFirstSkull && !graceUsed) {
      graceUsed = true;
      return;
    }
    skullCount += 1;
  });
  return finishRoll(state, faces, lockedSkullIndices, skullCount, graceUsed);
}

export function settleAltar(state: RelicAltarState): AltarSettlement {
  if (state.status === "bust") {
    return {
      status: "bust",
      crystalPairs: state.protectsSmallRewards ? state.securedRewards.crystalPairs : 0,
      blessingCount: state.protectsSmallRewards ? state.securedRewards.blessingCount : 0,
      relicReady: false,
      nextBattleSkullCurse: 1,
    };
  }
  const rewards = state.pendingRewards;
  return {
    status: "stopped",
    crystalPairs: Math.max(state.securedRewards.crystalPairs, rewards.crystalPairs),
    blessingCount: Math.max(state.securedRewards.blessingCount, rewards.blessingCount),
    relicReady: rewards.relicReady,
    nextBattleSkullCurse: 0,
  };
}

export function stopAltar(state: RelicAltarState): RelicAltarState {
  if (state.status === "bust") return state;
  return { ...state, status: "stopped" };
}

export function faceLabel(face: AltarFace | null): string {
  return face === "crystal" ? "水晶" : face === "relic" ? "遺物" : face === "blessing" ? "祝福" : face === "skull" ? "Skull" : "未投擲";
}
