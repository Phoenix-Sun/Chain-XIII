import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Chain XIII game shell", () => {
  it("renders the pixel town as the default view", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "十三演武場" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "十三城地圖" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "城鎮領地設施" })).toHaveAttribute("aria-current", "page");
  });

  it("routes expedition, battle, and development through the thumb menu", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "遠征選擇路線" }));
    expect(screen.getByRole("heading", { name: "單向節點地圖" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "對局十三支戰" }));
    expect(screen.getByRole("heading", { name: "十三支分墩實驗台" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "記錄開發卷宗" }));
    expect(screen.getByRole("heading", { name: "城鎮開發卷宗" })).toBeInTheDocument();
  });

  it("pauses into a touch-friendly system overlay", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "選單系統" }));
    expect(screen.getByRole("dialog", { name: "系統選單" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回遊戲" }));
    expect(screen.queryByRole("dialog", { name: "系統選單" })).not.toBeInTheDocument();
  });
});