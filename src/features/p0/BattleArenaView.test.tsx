import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BattleArenaView from "./BattleArenaView";

describe("BattleArenaView", () => {
  it("exposes the enemy AI result surface next to the P0 layout lab", () => {
    render(<BattleArenaView />);
    expect(screen.getByRole("heading", { name: "十三支分墩實驗台" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "敵我三墩比較" })).toBeInTheDocument();
    expect(screen.getByText(/固定 seed 生成敵方/)).toBeInTheDocument();
  });
});
