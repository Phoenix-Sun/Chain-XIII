import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createRunState } from "../domain/run";
import GeneWorkshopView from "./GeneWorkshopView";

describe("GeneWorkshopView", () => {
  it("groups same-lane chains as clear replacement choices", () => {
    render(<GeneWorkshopView />);
    expect(screen.getByRole("heading", { name: "頭墩・3 格" })).toBeInTheDocument();
    expect(screen.getByText("3 條可選")).toBeInTheDocument();
    expect(screen.getAllByText(/同一墩同時只使用一條，其他是替換候選/)).toHaveLength(3);
    expect(screen.getByRole("button", { name: /潮焰・前鋒/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles a fixed element without changing its pattern", () => {
    render(<GeneWorkshopView />);
    const waterSlot = screen.getByRole("button", { name: "第 1 格 水元素已啟用" });
    fireEvent.click(waterSlot);
    expect(screen.getByText("目前配置：無火風")).toBeInTheDocument();
    expect(waterSlot).toHaveAttribute("aria-pressed", "false");
  });

  it("switches between two chains on the same lane", () => {
    const onEquippedChange = vi.fn();
    render(<GeneWorkshopView onEquippedChange={onEquippedChange} />);
    fireEvent.click(screen.getByRole("button", { name: /潮焰・前鋒/ }));
    expect(screen.getByText("目前配置：水水火")).toBeInTheDocument();
    expect(onEquippedChange).toHaveBeenLastCalledWith(expect.objectContaining({ short3: expect.objectContaining({ id: "gene-boss-water-fire" }) }));
  });

  it("lets the smith activate all selected pattern slots once per run", () => {
    const onRunUpdated = vi.fn();
    const onInventoryChange = vi.fn();
    render(<GeneWorkshopView
      run={createRunState("forge-ability", ["fire-smith"])}
      partyCharacterIds={["fire-smith"]}
      onRunUpdated={onRunUpdated}
      onInventoryChange={onInventoryChange}
    />);

    fireEvent.click(screen.getByRole("button", { name: /鍛造師・全部啟用/ }));
    expect(screen.getByRole("status")).toHaveTextContent(/全部啟用/);
    expect(onRunUpdated).toHaveBeenLastCalledWith(expect.objectContaining({ discoveredRunFlags: ["effect:ability-forge"] }));
    expect(screen.getByRole("button", { name: /鍛造師・全部啟用・已用/ })).toBeDisabled();
    expect(onInventoryChange).toHaveBeenCalled();
  });
});
