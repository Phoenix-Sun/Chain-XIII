import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TownView from "./TownView";

describe("TownView", () => {
  it("presents the camp as a command scene with one clear next action", () => {
    render(<TownView onNavigate={vi.fn()} />);
    expect(screen.getByRole("region", { name: "營地指揮台" })).toBeInTheDocument();
    expect(screen.getByText("下一步")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /選擇隊伍/ })).toBeInTheDocument();
  });

  it("selects a facility directly on the pixel scene", () => {
    render(<TownView onNavigate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "鍊成篝火" }));
    const panel = screen.getByRole("complementary");
    expect(within(panel).getByRole("heading", { name: "鍊成篝火" })).toBeInTheDocument();
    expect(within(panel).getByText(/合成基因鏈/)).toBeInTheDocument();
  });

  it("gives immediate feedback from the large facility action", () => {
    const onNavigate = vi.fn();
    render(<TownView onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "選擇隊伍" }));
    expect(onNavigate).toHaveBeenCalledWith("party");
  });
});