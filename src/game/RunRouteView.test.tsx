import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RunRouteView from "./RunRouteView";

describe("RunRouteView", () => {
  it("only enables the connected next layer and advances after a click", () => {
    render(<RunRouteView />);
    const reachable = screen.getAllByRole("button", { name: /戰鬥|強敵|事件|獎勵/ }).filter((button) => !button.hasAttribute("disabled"));
    expect(reachable.length).toBeGreaterThan(0);
    fireEvent.click(reachable[0]);
    expect(screen.getByText(/下一步：/)).toBeInTheDocument();
  });

  it("gives each reachable node a location so same-type choices are distinguishable", () => {
    render(<RunRouteView />);
    const reachable = screen.getAllByRole("button", { name: /第 2 層・第/ }).filter((button) => !button.hasAttribute("disabled"));
    expect(reachable.length).toBeGreaterThan(0);
    expect(reachable[0]).toHaveAccessibleName(/第 2 層・第 1 格|第 2 層・第 2 格|第 2 層・第 3 格/);
  });
});
