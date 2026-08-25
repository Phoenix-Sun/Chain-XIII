import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExplorationView from "./ExplorationView";

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
});