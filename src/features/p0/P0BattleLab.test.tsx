import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
    fireEvent.click(screen.getByRole("button", { name: "花色" }));
    expect(screen.getByText("13 張", { selector: ".subsection-heading strong" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "花色" })).toHaveAttribute("aria-pressed", "true");
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

    const frontLane = screen.getByRole("region", { name: "頭墩" });
    const frontCards = within(frontLane).getAllByRole("button").filter((button) => button.classList.contains("playing-card"));
    frontCards.forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "退回手牌" }));

    expect(screen.getByText("0/13")).toBeInTheDocument();
    expect(screen.getByText("0/3", { selector: ".lane-size" })).toBeInTheDocument();
  });

  it("fills the only remaining lane after eight cards are placed", () => {
    render(<P0BattleLab />);
    const handCards = () => within(screen.getByLabelText("未配置手牌")).getAllByRole("button");
    handCards().slice(0, 3).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入頭墩" }));
    handCards().slice(0, 5).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入中墩" }));

    fireEvent.click(screen.getByRole("button", { name: /補齊尾墩/ }));

    expect(screen.getByText("13/13")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "尾墩" })).toHaveTextContent("5/5");
    expect(screen.getByRole("status")).toHaveTextContent("仍可逐張撤回");
  });

  it("swaps the middle and back lanes as one quick action", () => {
    render(<P0BattleLab />);
    const handCards = () => within(screen.getByLabelText("未配置手牌")).getAllByRole("button");
    handCards().slice(0, 5).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入中墩" }));
    handCards().slice(0, 5).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入尾墩" }));

    fireEvent.click(screen.getByRole("button", { name: "中尾墩互換" }));

    expect(screen.getByRole("status")).toHaveTextContent("中墩與尾墩已互換");
  });

  it("allows Tide Flow to retune one formed elemental lane", () => {
    const cards = Array.from({ length: 13 }, (_, index) => ({
      id: `card-${index}`,
      rank: (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13,
      suit: index < 3 ? "fire" as const : "water" as const,
      currentSuit: index < 3 ? "fire" as const : "water" as const,
    }));
    const onElementShift = vi.fn(() => true);
    render(<P0BattleLab cards={cards} canShiftElement onElementShift={onElementShift} />);
    const handCards = screen.getAllByRole("button").filter((button) => button.classList.contains("playing-card"));
    handCards.slice(0, 3).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入頭墩" }));

    fireEvent.click(screen.getByRole("button", { name: "潮汐流轉・調整元素墩" }));
    fireEvent.click(screen.getByRole("button", { name: "頭墩改成水" }));

    expect(onElementShift).toHaveBeenCalledWith("front", "water");
    expect(screen.getByRole("status")).toHaveTextContent("頭墩已調整為水元素");
  });

  it("clears a lane element override when the lane is returned to hand", () => {
    const cards = Array.from({ length: 13 }, (_, index) => ({
      id: `card-${index}`,
      rank: (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13,
      suit: index < 3 ? "fire" as const : "water" as const,
      currentSuit: index < 3 ? "fire" as const : "water" as const,
    }));
    const onLayoutConfirmed = vi.fn();
    render(<P0BattleLab cards={cards} canShiftElement onElementShift={() => true} onLayoutConfirmed={onLayoutConfirmed} />);
    const handCards = () => within(screen.getByLabelText("未配置手牌")).getAllByRole("button");
    handCards().slice(0, 3).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入頭墩" }));
    fireEvent.click(screen.getByRole("button", { name: "潮汐流轉・調整元素墩" }));
    fireEvent.click(screen.getByRole("button", { name: "頭墩改成水" }));

    const frontLane = screen.getByRole("region", { name: "頭墩" });
    within(frontLane).getAllByRole("button").filter((button) => button.classList.contains("playing-card")).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "退回手牌" }));
    handCards().slice(0, 3).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入頭墩" }));
    handCards().slice(0, 5).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入中墩" }));
    handCards().slice(0, 5).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入尾墩" }));
    fireEvent.click(screen.getByRole("button", { name: "確認這副牌" }));

    expect(onLayoutConfirmed).toHaveBeenCalledWith(expect.anything(), cards, {});
  });

  it("moves a lane element override together with a middle/back swap", () => {
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 1] as const;
    const suits = ["water", "water", "fire", "fire", "fire", "fire", "fire", "water", "fire", "wind", "earth", "water"] as const;
    const cards = Array.from({ length: 13 }, (_, index) => ({
      id: `card-${index}`,
      rank: ranks[index],
      suit: suits[index],
      currentSuit: suits[index],
    }));
    const onLayoutConfirmed = vi.fn();
    render(<P0BattleLab cards={cards} canShiftElement onElementShift={() => true} onLayoutConfirmed={onLayoutConfirmed} />);
    const handCards = () => within(screen.getByLabelText("未配置手牌")).getAllByRole("button");
    handCards().slice(0, 3).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入頭墩" }));
    handCards().slice(0, 5).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入中墩" }));
    handCards().slice(0, 5).forEach((card) => fireEvent.click(card));
    fireEvent.click(screen.getByRole("button", { name: "放入尾墩" }));
    fireEvent.click(screen.getByRole("button", { name: "潮汐流轉・調整元素墩" }));
    fireEvent.click(screen.getByRole("button", { name: "中墩改成水" }));
    fireEvent.click(screen.getByRole("button", { name: "中尾墩互換" }));
    expect(screen.getByText("合法分墩")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "確認這副牌" }));

    expect(onLayoutConfirmed).toHaveBeenCalledWith(expect.anything(), cards, { back: "water" });
  });
});
