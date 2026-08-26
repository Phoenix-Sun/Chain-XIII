import { SeededRandom } from "./random";

export type MapNodeType = "battle" | "elite" | "event" | "relic" | "boss";
export type RunChapter = 1 | 2 | 3;

export interface RunMapNode {
  id: string;
  row: number;
  column: number;
  chapter?: RunChapter;
  type: MapNodeType;
  monsterId?: string;
  eventId?: string;
  relicId?: string;
  nextNodeIds: string[];
}

export interface RunMap {
  seed: string;
  nodes: RunMapNode[];
  startNodeId: string;
  bossNodeId: string;
  chapterBossNodeIds: string[];
  chapterLengths: [number, number, number];
}

const NODE_TYPES_BY_CHAPTER: Record<RunChapter, MapNodeType[]> = {
  1: ["battle", "battle", "elite", "event", "relic"],
  2: ["battle", "battle", "elite", "elite", "event", "relic"],
  3: ["battle", "elite", "elite", "elite", "event", "relic"],
};
const BOSS_IDS = ["boss-lava-turtle", "boss-storm-bird", "boss-deep-sea"] as const;
export const RUN_CHAPTER_LENGTH_RANGES: ReadonlyArray<{ min: number; max: number }> = [
  { min: 10, max: 13 },
  { min: 7, max: 9 },
  { min: 4, max: 6 },
];

export function enemyTiebreakerBonusForChapter(chapter?: RunChapter): number {
  return chapter === 3 ? 2 : chapter === 2 ? 1 : 0;
}

export function nodeTypesForChapter(chapter: RunChapter): readonly MapNodeType[] {
  return NODE_TYPES_BY_CHAPTER[chapter];
}

export function generateRunMap(seed: string): RunMap {
  const random = new SeededRandom(seed);
  const chapterLengths = RUN_CHAPTER_LENGTH_RANGES.map(({ min, max }) => min + random.int(max - min + 1)) as [number, number, number];
  const chapterBossIds = [...BOSS_IDS];
  const nodes: RunMapNode[] = [];
  let row = 0;
  for (let chapterIndex = 0; chapterIndex < chapterLengths.length; chapterIndex += 1) {
    const chapter = (chapterIndex + 1) as RunChapter;
    const chapterLength = chapterLengths[chapterIndex];
    const chapterBossId = chapterBossIds.splice(random.int(chapterBossIds.length), 1)[0];
    for (let localRow = 0; localRow < chapterLength; localRow += 1) {
      const isStart = row === 0;
      const isBoss = localRow === chapterLength - 1;
      const count = isStart || isBoss ? 1 : 2 + random.int(2);
      for (let column = 0; column < count; column += 1) {
        const type = isBoss ? "boss" : isStart ? "battle" : random.pick(nodeTypesForChapter(chapter));
        const monsterId = type === "boss"
        ? chapterBossId
        : type === "elite"
          ? `monster-elite-${random.int(4) + 1}`
          : type === "battle"
            ? `monster-normal-${random.int(12) + 1}`
            : undefined;
        nodes.push({ id: `r${row}n${column}`, row, column, chapter, type, monsterId, eventId: type === "event" ? `event-${(row + column) % 12 + 1}` : undefined, relicId: type === "relic" ? `relic-${(row + column) % 15 + 1}` : undefined, nextNodeIds: [] });
      }
      row += 1;
    }
  }
  for (const node of nodes) {
    const next = nodes.filter((candidate) => candidate.row === node.row + 1);
    node.nextNodeIds = next.map((candidate) => candidate.id).filter(() => random.next() > 0.35);
    if (node.nextNodeIds.length === 0 && next[0]) node.nextNodeIds = [next[0].id];
  }
  const startNodeId = nodes[0].id;
  const bossNodeId = nodes[nodes.length - 1].id;
  return { seed, nodes, startNodeId, bossNodeId, chapterBossNodeIds: nodes.filter((node) => node.type === "boss").map((node) => node.id), chapterLengths };
}
