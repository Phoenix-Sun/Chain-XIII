import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createRunState } from "../domain/run";
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

  it("lets the smith activate the fusion preview ability once per run", () => {
    const onRunUpdated = vi.fn();
    const onInventoryChange = vi.fn();
    render(<GeneWorkshopView
      run={createRunState("forge-ability", ["fire-smith"])}
      partyCharacterIds={["fire-smith"]}
      onRunUpdated={onRunUpdated}
      onInventoryChange={onInventoryChange}
    />);

    fireEvent.click(screen.getByRole("button", { name: /鍛造師・保留融合預覽/ }));
    expect(screen.getByRole("status")).toHaveTextContent(/保留了融合預覽/);
    expect(onRunUpdated).toHaveBeenLastCalledWith(expect.objectContaining({ discoveredRunFlags: ["effect:ability-forge"] }));
    expect(screen.getByRole("button", { name: /鍛造師・保留融合預覽・已用/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "確認鍊成" }));
    expect(onInventoryChange).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: "chain-water-wind" }),
      expect.objectContaining({ id: "fusion:chain-water-wind+chain-earth-fire" }),
    ]));
  });
});
