import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExplorationView from "./ExplorationView";
import { createRunState } from "../domain/run";

describe("ExplorationView", () => {
  it("shows the deterministic roll result before handing the player to rewards", () => {
    const onResolved = vi.fn();
    render(<ExplorationView node={{ id: "event", row: 1, column: 0, type: "event", eventId: "event-2", nextNodeIds: [] }} seed="exploration-test" onResolved={onResolved} />);

    fireEvent.click(screen.getByRole("button", { name: "擲出 3 顆骰子" }));

    expect(screen.getByRole("status")).toHaveTextContent(/總和|相同點數/);
    expect(onResolved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "查看事件獎勵" }));
    expect(onResolved).toHaveBeenCalledTimes(1);
  });

  it("lets the wind merchant spend its one-shot effect to reroll an event", () => {
    const run = createRunState("exploration-ability", ["gale-merchant"]);
    const onRunUpdated = vi.fn();
    render(<ExplorationView node={{ id: "event", row: 1, column: 0, type: "event", eventId: "event-2", nextNodeIds: [] }} seed="exploration-ability" run={run} partyCharacterIds={["gale-merchant"]} onRunUpdated={onRunUpdated} onResolved={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "擲出 3 顆骰子" }));
    fireEvent.click(screen.getByRole("button", { name: /風行商人/ }));
    expect(onRunUpdated).toHaveBeenCalledWith(expect.objectContaining({ discoveredRunFlags: ["effect:ability-trade"] }));
    expect(screen.getByRole("button", { name: "擲出 3 顆骰子" })).toBeInTheDocument();
  });

  it("shows a distinct straight objective and result signal", () => {
    render(<ExplorationView node={{ id: "event", row: 1, column: 0, type: "event", eventId: "event-3", nextNodeIds: [] }} seed="exploration-straight" onResolved={vi.fn()} />);

    expect(screen.getByText("擲出一組連續點數")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "擲出 3 顆骰子" }));
    expect(screen.getByRole("status")).toHaveTextContent(/連續點數|非連續點數/);
  });
});