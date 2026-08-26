import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ServiceNodeView from "./ServiceNodeView";
import { createRunState } from "../domain/run";

describe("ServiceNodeView", () => {
  it("shows three explicit caravan tradeoffs and resolves the selected one", () => {
    const run = createRunState("caravan-ui", ["water-scout"]);
    const node = { ...run.map.nodes[1], type: "caravan" as const };
    const onResolved = vi.fn();
    render(<ServiceNodeView node={node} run={{ ...run, currentNodeId: node.id, earnedCrystals: 10 }} onResolved={onResolved} />);
    expect(screen.getByRole("heading", { name: "流動商隊" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: /付費情報/ }));
    expect(onResolved).toHaveBeenCalledWith(expect.objectContaining({ discoveredRunFlags: expect.arrayContaining(["route:next-layer-revealed"]) }));
  });

  it("offers campfire recovery and lookout preview", () => {
    const run = createRunState("support-ui", ["water-scout"]);
    const campfire = { ...run.map.nodes[1], type: "campfire" as const };
    const lookout = { ...run.map.nodes[2], type: "lookout" as const };
    const onResolved = vi.fn();
    const { rerender } = render(<ServiceNodeView node={campfire} run={{ ...run, currentNodeId: campfire.id, livesRemaining: 1 }} onResolved={onResolved} />);
    fireEvent.click(screen.getByRole("button", { name: /休息/ }));
    expect(onResolved).toHaveBeenCalledWith(expect.objectContaining({ livesRemaining: 2 }));
    rerender(<ServiceNodeView node={lookout} run={{ ...run, currentNodeId: lookout.id }} onResolved={onResolved} />);
    expect(screen.getByRole("heading", { name: "高地瞭望台" })).toBeInTheDocument();
  });
});
