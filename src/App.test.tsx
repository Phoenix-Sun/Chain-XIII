import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Chain XIII shell", () => {
  it("renders the MVP baseline and Worker endpoint", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "P0 規則核心" })).toBeInTheDocument();
    expect(screen.getByText("GET /api/health")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Prototype 開發進度圖" })).toBeInTheDocument();
  });
});
