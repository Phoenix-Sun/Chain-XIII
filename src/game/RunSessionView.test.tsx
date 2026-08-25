import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createRunState, type RunState } from "../domain/run";
import RunSessionView from "./RunSessionView";

describe("RunSessionView", () => {
  it("restores an unclaimed Boss reward after reload even when the Run is already won", () => {
    const base = createRunState("boss-reward-reload", ["water-scout"]);
    const boss = base.map.nodes.find((node) => node.id === base.map.bossNodeId)!;
    const initialRun: RunState = { ...base, currentNodeId: boss.id, completedNodeIds: [...base.completedNodeIds, boss.id], status: "won" };
    render(<RunSessionView initialRun={initialRun} />);
    expect(screen.getByRole("heading", { name: "Boss 獎勵" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "領取並結算" })).toBeInTheDocument();
  });

  it("moves from a route node to reward and then into the boss battle", () => {
    const base = createRunState("session-test", ["water-scout"]);
    const initialRun: RunState = {
      ...base,
      map: {
        ...base.map,
        startNodeId: "start",
        bossNodeId: "boss",
        nodes: [
          { id: "start", row: 0, column: 0, type: "battle", nextNodeIds: ["event"] },
          { id: "event", row: 1, column: 0, type: "event", nextNodeIds: ["boss"] },
          { id: "boss", row: 2, column: 0, type: "boss", monsterId: "boss-lava-turtle", nextNodeIds: [] },
        ],
      },
      currentNodeId: "start",
      finalBossId: "boss",
      completedNodeIds: ["start"],
    };

    render(<RunSessionView initialRun={initialRun} />);
    fireEvent.click(screen.getByRole("button", { name: "事件" }));
    expect(screen.getByRole("heading", { name: "路線事件" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "擲出 3 顆骰子" }));
    expect(screen.getByRole("button", { name: "領取獎勵" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "領取獎勵" }));
    fireEvent.click(screen.getByRole("button", { name: "Boss" }));
    expect(screen.getByText(/Boss.*排好 13 張牌/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "排好這副牌" })).toBeInTheDocument();
  });
});
