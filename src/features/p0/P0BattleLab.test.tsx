import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import P0BattleLab from "./P0BattleLab";

describe("P0BattleLab", () => {
  it("lets a player select a card and place it into a lane", () => {
    render(<P0BattleLab />);

    const firstCard = screen.getAllByRole("button").find((button) => button.classList.contains("playing-card"));
    expect(firstCard).toBeDefined();
    fireEvent.click(firstCard!);

    const frontButton = screen.getByRole("button", { name: "頭墩 3" });
    expect(frontButton).not.toBeDisabled();
    fireEvent.click(frontButton);

    expect(screen.getByText("1/13 已配置")).toBeInTheDocument();
    expect(screen.getByText("頭墩", { selector: ".lane-label" })).toBeInTheDocument();
    expect(screen.getByText("1/3", { selector: ".lane-size" })).toBeInTheDocument();
  });
});
