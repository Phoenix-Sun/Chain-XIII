import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TownView from "./TownView";

describe("TownView", () => {
  it("selects a facility directly on the pixel scene", () => {
    render(<TownView />);
    fireEvent.click(screen.getByRole("button", { name: "花色鍊成屋" }));
    const panel = screen.getByRole("complementary");
    expect(within(panel).getByRole("heading", { name: "花色鍊成屋" })).toBeInTheDocument();
    expect(within(panel).getByText(/接合怪物基因/)).toBeInTheDocument();
  });

  it("gives immediate feedback from the large facility action", () => {
    render(<TownView />);
    fireEvent.click(screen.getByRole("button", { name: "前往對局" }));
    expect(screen.getByText(/十三演武場已標記/)).toBeInTheDocument();
  });
});