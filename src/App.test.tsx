import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Chain XIII game shell", () => {
  it("renders the expedition camp as the default view", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "隊伍帳篷" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "遠征營地" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "營地目前位置" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps the expedition flow locked while allowing gene management between nodes", () => {
    render(<App initialSeed="CHAIN-XIII-RUN-001" />);

    fireEvent.click(screen.getByRole("button", { name: "選擇隊伍" }));
    expect(screen.getByRole("heading", { name: "選擇這次遠征的角色" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "開始遠征" }));
    expect(screen.getByRole("heading", { name: "選擇下一站" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "路線選擇下一站" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "鍊成改造花色" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "整理基因鏈" }));
    expect(screen.getByRole("heading", { name: "花色鍊成工房" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "回到路線" }));

    const nextBattle = screen.getAllByRole("button", { name: /^戰鬥・第 2 層/ }).find((button) => !button.hasAttribute("disabled"));
    expect(nextBattle).toBeDefined();
    fireEvent.click(nextBattle!);
    expect(screen.getByRole("heading", { name: "排好這副牌" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "開啟選單" }));
    fireEvent.click(screen.getByRole("button", { name: "返回遊戲" }));
  });

  it("pauses into a touch-friendly system overlay", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "開啟選單" }));
    expect(screen.getByRole("dialog", { name: "系統選單" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回遊戲" }));
    expect(screen.queryByRole("dialog", { name: "系統選單" })).not.toBeInTheDocument();
  });

  it("routes a first-time player through party setup instead of starting a Run directly", () => {
    render(<App initialSeed="CHAIN-XIII-RUN-001" />);
    fireEvent.click(screen.getByRole("button", { name: "路線桌" }));
    fireEvent.click(screen.getByRole("button", { name: "選擇隊伍" }));
    expect(screen.getByRole("heading", { name: "選擇這次遠征的角色" })).toBeInTheDocument();
  });
});