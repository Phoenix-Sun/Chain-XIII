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
    expect(screen.getByRole("heading", { name: "組成你的遠征隊" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /主動技：水紋回響・重抽/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "開始遠征" }));
    expect(screen.getByRole("heading", { name: "選擇下一站" })).toBeInTheDocument();
    expect(screen.getByText(/先從第一場戰鬥開始/)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "路線選擇下一站" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "配置選擇花色" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "配置基因鏈" }));
    expect(screen.getByRole("heading", { name: "基因鏈配置" })).toBeInTheDocument();
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
    const menuButton = screen.getByRole("button", { name: "開啟選單" });
    fireEvent.click(menuButton);
    expect(screen.getByRole("dialog", { name: "遊戲暫停" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回遊戲" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(menuButton).toHaveFocus();
    expect(screen.queryByRole("dialog", { name: "遊戲暫停" })).not.toBeInTheDocument();
    fireEvent.click(menuButton);
    fireEvent.click(screen.getByRole("button", { name: "返回遊戲" }));
    expect(screen.queryByRole("dialog", { name: "遊戲暫停" })).not.toBeInTheDocument();
  });

  it("uses one run-level abandon action and returns to camp without keeping the run active", () => {
    render(<App initialSeed="CHAIN-XIII-ABANDON-001" />);
    fireEvent.click(screen.getByRole("button", { name: "選擇隊伍" }));
    fireEvent.click(screen.getByRole("button", { name: "開始遠征" }));
    fireEvent.click(screen.getByRole("button", { name: "開啟選單" }));
    fireEvent.click(screen.getByRole("button", { name: "放棄這趟遠征" }));
    expect(screen.getByRole("heading", { name: "放棄這趟遠征？" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "確認放棄這趟遠征" }));
    expect(screen.getByRole("heading", { name: "隊伍帳篷" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "放棄這趟遠征" })).not.toBeInTheDocument();
  });

  it("routes a first-time player through party setup instead of starting a Run directly", () => {
    render(<App initialSeed="CHAIN-XIII-RUN-001" />);
    fireEvent.click(screen.getByRole("button", { name: "路線桌" }));
    fireEvent.click(screen.getByRole("button", { name: "選擇隊伍" }));
    expect(screen.getByRole("heading", { name: "組成你的遠征隊" })).toBeInTheDocument();
  });
});