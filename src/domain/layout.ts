import type { Card } from "./cards";
import { compareHandRanks, evaluateHand, type HandRank } from "./hands";

export const LANE_SIZES = {
  front: 3,
  middle: 5,
  back: 5,
} as const;

export type LaneId = keyof typeof LANE_SIZES;
export type Lanes = Record<LaneId, Card[]>;

export const LANE_LABELS: Record<LaneId, string> = {
  front: "頭墩",
  middle: "中墩",
  back: "尾墩",
};

export interface LayoutValidation {
  valid: boolean;
  errors: string[];
  evaluated?: Record<LaneId, HandRank>;
}

export function emptyLanes(): Lanes {
  return { front: [], middle: [], back: [] };
}

export function swapLanes(lanes: Lanes, first: LaneId, second: LaneId): Lanes {
  return { ...lanes, [first]: lanes[second], [second]: lanes[first] };
}

export function fillLastOpenLane(lanes: Lanes, hand: Card[]): { lane: LaneId; lanes: Lanes } | undefined {
  const openLanes = (Object.keys(LANE_SIZES) as LaneId[]).filter((lane) => lanes[lane].length === 0);
  const fullLanes = (Object.keys(LANE_SIZES) as LaneId[]).every((lane) => lanes[lane].length === 0 || lanes[lane].length === LANE_SIZES[lane]);
  if (openLanes.length !== 1 || !fullLanes) return undefined;
  const lane = openLanes[0];
  if (hand.length !== LANE_SIZES[lane]) return undefined;
  return { lane, lanes: { ...lanes, [lane]: [...hand] } };
}

export function validateLayout(lanes: Lanes): LayoutValidation {
  const errors: string[] = [];
  const allCards = [...lanes.front, ...lanes.middle, ...lanes.back];
  const uniqueIds = new Set(allCards.map((card) => card.id));

  if (allCards.length !== uniqueIds.size) errors.push("同一張牌不能重複放入不同墩位");

  for (const lane of Object.keys(LANE_SIZES) as LaneId[]) {
    if (lanes[lane].length !== LANE_SIZES[lane]) {
      errors.push(`${LANE_LABELS[lane]}需要 ${LANE_SIZES[lane]} 張牌，目前 ${lanes[lane].length} 張`);
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  const evaluated = {
    front: evaluateHand(lanes.front),
    middle: evaluateHand(lanes.middle),
    back: evaluateHand(lanes.back),
  };

  if (compareHandRanks(evaluated.front, evaluated.middle) >= 0) {
    errors.push(`中墩（${evaluated.middle.label}）必須大於頭墩（${evaluated.front.label}）`);
  }
  if (compareHandRanks(evaluated.middle, evaluated.back) >= 0) {
    errors.push(`尾墩（${evaluated.back.label}）必須大於中墩（${evaluated.middle.label}）`);
  }

  return { valid: errors.length === 0, errors, evaluated };
}
