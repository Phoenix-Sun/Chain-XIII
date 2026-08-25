import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createRunState, type RunState } from "../domain/run";
import RunSessionView from "./RunSessionView";

describe("RunSessionView", () => {
  it("reports the active phase to the shared game HUD", () => {
    const base = createRunState("phase-report", ["water-scout"]);
    const boss = base.map.nodes.find((node) => node.id === base.map.bossNodeId)!;
    const onPhaseChange = vi.fn();
    render(<RunSessionView initialRun={{ ...base, currentNodeId: boss.id }} onPhaseChange={onPhaseChange} />);
    expect(onPhaseChange).toHaveBeenCalledWith("battle");
  });

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
    fireEvent.click(screen.getByRole("button", { name: /^事件・第 2 層/ }));
    expect(screen.getByRole("heading", { name: "路線事件" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "擲出 3 顆骰子" }));
    expect(screen.getByRole("status")).toHaveTextContent(/總和|相同點數/);
    expect(screen.getByRole("button", { name: "查看事件獎勵" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "查看事件獎勵" }));
    expect(screen.getByRole("button", { name: "領取獎勵" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "領取獎勵" }));
    fireEvent.click(screen.getByRole("button", { name: /^Boss・第 3 層/ }));
    expect(screen.getByRole("region", { name: "敵方資訊" })).toHaveTextContent(/Boss.*Boss・lava turtle/);
    expect(screen.getByRole("heading", { name: "排好這副牌" })).toBeInTheDocument();
  });

  it("keeps the selected party visible while choosing the next route", () => {
    const base = createRunState("party-summary", ["water-scout", "fire-smith"]);
    const initialRun: RunState = { ...base, completedNodeIds: [base.map.startNodeId] };

    render(<RunSessionView initialRun={initialRun} />);

    expect(screen.getByText("本次出戰：water scout、fire smith")).toBeInTheDocument();
  });
});
