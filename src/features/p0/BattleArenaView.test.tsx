import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { arrangeEnemyHand } from "../../domain/ai";
import { drawThirteen, rankLabel, SUIT_LABELS, type Card } from "../../domain/cards";
import { resolveBattle } from "../../domain/combat";
import { validateLayout, type Lanes } from "../../domain/layout";
import BattleArenaView from "./BattleArenaView";

function combinations<T>(items: T[], choose: number): T[][] {
  const result: T[][] = [];
  function visit(start: number, picked: T[]): void {
    if (picked.length === choose) { result.push([...picked]); return; }
    for (let index = start; index <= items.length - (choose - picked.length); index += 1) visit(index + 1, [...picked, items[index]]);
  }
  visit(0, []);
  return result;
}

function findWinningLayout(cards: Card[], enemy: Lanes): Lanes {
  for (const front of combinations(cards, 3)) {
    const remaining = cards.filter((card) => !front.some((candidate) => candidate.id === card.id));
    for (const middle of combinations(remaining, 5)) {
      const back = remaining.filter((card) => !middle.some((candidate) => candidate.id === card.id));
      const layout = { front, middle, back };
      if (validateLayout(layout).valid && resolveBattle(layout, enemy).outcome === "win") return layout;
    }
  }
  throw new Error("測試牌局找不到勝利排法");
}

describe("BattleArenaView", () => {
  it("exposes the enemy AI result surface next to the P0 layout lab", () => {
    render(<BattleArenaView />);
    expect(screen.getByRole("heading", { name: "排好這副牌" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "敵我三墩比較" })).toBeInTheDocument();
    expect(screen.getByText(/完成一副合法牌組/)).toBeInTheDocument();
  });

  it("uses a player-facing enemy label instead of an internal monster id", () => {
    render(<BattleArenaView node={{ id: "battle", row: 0, column: 0, type: "battle", monsterId: "monster-normal-6", nextNodeIds: [] }} />);

    expect(screen.getByText(/普通怪物 6/)).toBeInTheDocument();
    expect(screen.queryByText(/monster normal 6/)).not.toBeInTheDocument();
  });

  it("commits a winning batch layout and returns the result to the run", () => {
    const cards = drawThirteen("CHAIN-XIII-P0-001");
    const enemy = arrangeEnemyHand(drawThirteen("enemy:preview"));
    const layout = findWinningLayout(cards, enemy);
    const onBattleComplete = vi.fn();
    render(<BattleArenaView onBattleComplete={onBattleComplete} />);

    function selectCards(group: Card[]) {
      group.forEach((card) => fireEvent.click(screen.getByRole("button", { name: `${SUIT_LABELS[card.suit]} ${rankLabel(card.rank)}` })));
    }

    selectCards(layout.front);
    fireEvent.click(screen.getByRole("button", { name: "放入頭墩" }));
    selectCards(layout.middle);
    fireEvent.click(screen.getByRole("button", { name: "放入中墩" }));
    selectCards(layout.back);
    fireEvent.click(screen.getByRole("button", { name: "放入尾墩" }));
    fireEvent.click(screen.getByRole("button", { name: "確認這副牌" }));
    expect(screen.getByRole("heading", { name: "這場對局勝出" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "領取獎勵" }));
    expect(onBattleComplete).toHaveBeenCalledWith(expect.objectContaining({ outcome: "win" }));
  });
});
