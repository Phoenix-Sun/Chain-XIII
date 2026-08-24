import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Chain XIII game shell", () => {
  it("renders the pixel town as the default view", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "十三城・初陣之地" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "十三城地圖" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "領地查看演武場" })).toHaveAttribute("aria-current", "page");
  });

  it("routes the battle and development slices through the main menu", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "對局進入十三支" }));
    expect(screen.getByRole("heading", { name: "十三支分墩實驗台" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "紀錄查看開發進度" }));
    expect(screen.getByRole("heading", { name: "城鎮開發卷宗" })).toBeInTheDocument();
    expect(screen.getByText("GET /api/health")).toBeInTheDocument();
  });
});
