import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PartyView from "./PartyView";

describe("PartyView", () => {
  it("allows a starter-only account to begin with one character", () => {
    const onConfirm = vi.fn();
    const onNavigate = vi.fn();
    render(<PartyView ownedCharacterIds={["water-scout"]} selectedCharacterIds={["water-scout"]} onConfirm={onConfirm} onNavigate={onNavigate} />);

    expect(screen.getByText(/只有預設角色也可以開始/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /開始遠征/ }));
    expect(onConfirm).toHaveBeenCalledWith(["water-scout"]);
    expect(onNavigate).toHaveBeenCalledWith("route");
  });

  it("lets a player choose up to three owned characters", () => {
    const onConfirm = vi.fn();
    render(<PartyView ownedCharacterIds={["water-scout", "fire-smith", "wind-oracle", "earth-guard"]} selectedCharacterIds={["water-scout"]} onConfirm={onConfirm} onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /fire smith/ }));
    fireEvent.click(screen.getByRole("button", { name: /wind oracle/ }));
    expect(screen.getByText("3/3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /earth guard/ }));
    expect(screen.getByText("3/3")).toBeInTheDocument();
  });

  it("caps an oversized restored selection at the three-person party limit", () => {
    render(<PartyView ownedCharacterIds={["water-scout", "fire-smith", "wind-oracle", "earth-guard"]} selectedCharacterIds={["water-scout", "fire-smith", "wind-oracle", "earth-guard"]} onConfirm={vi.fn()} onNavigate={vi.fn()} />);
    expect(screen.getByText("3/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /開始遠征/ })).not.toBeDisabled();
  });
});
