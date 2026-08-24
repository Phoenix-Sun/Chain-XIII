import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GeneWorkshopView from "./GeneWorkshopView";

describe("GeneWorkshopView", () => {
  it("previews and commits a non-reversible fusion", () => {
    render(<GeneWorkshopView />);
    expect(screen.getByText(/同元素融合升階/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "確認鍊成" }));
    expect(screen.getByText(/已合成 fusion:/)).toBeInTheDocument();
    expect(screen.getByText(/原鏈已消耗，這個結果無法復原/)).toBeInTheDocument();
  });

  it("keeps invalid chain lengths out of equipment slots", () => {
    render(<GeneWorkshopView />);
    const fiveSlotButtons = screen.getAllByRole("button", { name: "5格" });
    expect(fiveSlotButtons.some((button) => button.hasAttribute("disabled"))).toBe(true);
  });
});
