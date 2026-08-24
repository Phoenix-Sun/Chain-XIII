import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RunRouteView from "./RunRouteView";

describe("RunRouteView", () => {
  it("only enables the connected next layer and advances after a click", () => {
    render(<RunRouteView />);
    const reachable = screen.getAllByRole("button", { name: /普通戰鬥|Elite 挑戰|探索事件|神器節點/ }).filter((button) => !button.hasAttribute("disabled"));
    expect(reachable.length).toBeGreaterThan(0);
    fireEvent.click(reachable[0]);
    expect(screen.getByText(/下一步：/)).toBeInTheDocument();
  });
});
