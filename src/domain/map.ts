import { SeededRandom } from "./random";

export type MapNodeType = "battle" | "elite" | "event" | "relic" | "boss";

export interface RunMapNode {
  id: string;
  row: number;
  column: number;
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
}

const NODE_TYPES: MapNodeType[] = ["battle", "battle", "elite", "event", "relic"];
const BOSS_IDS = ["boss-lava-turtle", "boss-storm-bird", "boss-deep-sea"] as const;

export function generateRunMap(seed: string, rowCount = 16): RunMap {
  if (rowCount < 3) throw new Error("Run 地圖至少需要 3 層");
  const random = new SeededRandom(seed);
  const finalBossId = random.pick(BOSS_IDS);
  const nodes: RunMapNode[] = [];
  for (let row = 0; row < rowCount; row += 1) {
    const count = row === 0 || row === rowCount - 1 ? 1 : 2 + random.int(2);
    for (let column = 0; column < count; column += 1) {
      const isBoss = row === rowCount - 1;
      const type = isBoss ? "boss" : row === 0 ? "battle" : random.pick(NODE_TYPES);
      const monsterId = type === "boss"
        ? finalBossId
        : type === "elite"
          ? `monster-elite-${random.int(4) + 1}`
          : type === "battle"
            ? `monster-normal-${random.int(12) + 1}`
            : undefined;
      nodes.push({ id: `r${row}n${column}`, row, column, type, monsterId, eventId: type === "event" ? `event-${(row + column) % 12 + 1}` : undefined, relicId: type === "relic" ? `relic-${(row + column) % 15 + 1}` : undefined, nextNodeIds: [] });
    }
  }
  for (const node of nodes) {
    const next = nodes.filter((candidate) => candidate.row === node.row + 1);
    node.nextNodeIds = next.map((candidate) => candidate.id).filter(() => random.next() > 0.35);
    if (node.nextNodeIds.length === 0 && next[0]) node.nextNodeIds = [next[0].id];
  }
  const startNodeId = nodes[0].id;
  const bossNodeId = nodes[nodes.length - 1].id;
  return { seed, nodes, startNodeId, bossNodeId };
}
