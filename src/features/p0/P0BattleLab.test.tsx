import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import P0BattleLab from "./P0BattleLab";

describe("P0BattleLab", () => {
  it("lets a player select three cards and place them into a lane at once", () => {
    render(<P0BattleLab />);

    const handCards = screen.getAllByRole("button").filter((button) => button.classList.contains("playing-card"));
    handCards.slice(0, 3).forEach((card) => fireEvent.click(card));

    const frontButton = screen.getByRole("button", { name: "放入頭墩" });
    expect(frontButton).not.toBeDisabled();
    fireEvent.click(frontButton);

    expect(screen.getByText("3/13")).toBeInTheDocument();
    expect(screen.getByText("頭墩", { selector: ".lane-label" })).toBeInTheDocument();
    expect(screen.getByText("3/3", { selector: ".lane-size" })).toBeInTheDocument();
  });

  it("offers rank and suit sorting without changing the hand count", () => {
    render(<P0BattleLab />);
    fireEvent.click(screen.getByRole("button", { name: "點數" }));
    fireEvent.click(screen.getByRole("button", { name: "花色／點數" }));
    expect(screen.getByText("13 張", { selector: ".subsection-heading span" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "花色／點數" })).toHaveAttribute("aria-pressed", "true");
  });

  it("places five selected cards into the middle or back lane at once", () => {
    render(<P0BattleLab />);
    const handCards = screen.getAllByRole("button").filter((button) => button.classList.contains("playing-card"));
    handCards.slice(0, 5).forEach((card) => fireEvent.click(card));

    expect(screen.getByRole("button", { name: "放入中墩" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "放入尾墩" })).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "放入中墩" }));

    expect(screen.getByText("5/13")).toBeInTheDocument();
    expect(screen.getByText("5/5", { selector: ".lane-size" })).toBeInTheDocument();
  });

  it("explains when the current selection is not a complete lane group", () => {
    render(<P0BattleLab />);
    const handCards = screen.getAllByRole("button").filter((button) => button.classList.contains("playing-card"));
    handCards.slice(0, 4).forEach((card) => fireEvent.click(card));

    expect(screen.getByText(/再選 1 張可放入中墩或尾墩/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "放入頭墩" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "放入中墩" })).toBeDisabled();
  });

  it("returns a completed lane to the hand as one selected group", () => {
    render(<P0BattleLab />);
    const handCards = screen.getAllByRole("button").filter((button) => button.classList.contains("playing-card"));
    handCards.slice(0, 3).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入頭墩" }));

    const frontCards = screen.getAllByRole("button").filter((button) => button.classList.contains("playing-card")).slice(0, 3);
    frontCards.forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "退回手牌" }));

    expect(screen.getByText("0/13")).toBeInTheDocument();
    expect(screen.getByText("0/3", { selector: ".lane-size" })).toBeInTheDocument();
  });
});
