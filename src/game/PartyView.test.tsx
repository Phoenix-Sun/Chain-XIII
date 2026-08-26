import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PartyView from "./PartyView";
import { createEmptyMeta } from "../domain/save";

describe("PartyView", () => {
  it("shows a formation brief and an explicit expedition lineup", () => {
    render(<PartyView ownedCharacterIds={["water-scout", "fire-smith"]} selectedCharacterIds={["water-scout"]} onConfirm={vi.fn()} onNavigate={vi.fn()} />);
    expect(screen.getByRole("region", { name: "遠征編成" })).toBeInTheDocument();
    expect(screen.getByText("出戰隊列")).toBeInTheDocument();
    expect(screen.getAllByText("water scout").length).toBeGreaterThan(0);
  });

  it("allows a starter-only account to begin with one character", () => {
    const onConfirm = vi.fn();
    const onNavigate = vi.fn();
    render(<PartyView ownedCharacterIds={["water-scout"]} selectedCharacterIds={["water-scout"]} onConfirm={onConfirm} onNavigate={onNavigate} />);

    expect(screen.getByText(/只有預設角色也可以開始/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /容易.*3 條命/ }));
    fireEvent.click(screen.getByRole("button", { name: /開始遠征/ }));
    expect(onConfirm).toHaveBeenCalledWith(["water-scout"], "easy");
    expect(onNavigate).toHaveBeenCalledWith("route");
  });

  it("shows the three expedition difficulty choices", () => {
    render(<PartyView ownedCharacterIds={["water-scout"]} selectedCharacterIds={["water-scout"]} onConfirm={vi.fn()} onNavigate={vi.fn()} />);
    expect(screen.getByRole("region", { name: "遠征難度" })).toHaveTextContent("容易");
    expect(screen.getByRole("region", { name: "遠征難度" })).toHaveTextContent("中等");
    expect(screen.getByRole("region", { name: "遠征難度" })).toHaveTextContent("困難");
    expect(screen.getByRole("button", { name: /中等.*2 條命/ })).toHaveAttribute("aria-pressed", "true");
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

  it("spends crystals to unlock a permanent skill from party prep", () => {
    const onMetaChange = vi.fn();
    const meta = { ...createEmptyMeta(), crystals: 80 };
    render(<PartyView ownedCharacterIds={["water-scout"]} selectedCharacterIds={["water-scout"]} onConfirm={vi.fn()} onNavigate={vi.fn()} meta={meta} onMetaChange={onMetaChange} />);

    fireEvent.click(screen.getByRole("button", { name: "80 水晶" }));

    expect(onMetaChange).toHaveBeenCalledWith(expect.objectContaining({ crystals: 0, permanentSkillNodeIds: ["expanded-satchel"] }));
    expect(screen.getByRole("status")).toHaveTextContent("永久技能已解鎖");
  });


  it("caps an oversized restored selection at the three-person party limit", () => {
    render(<PartyView ownedCharacterIds={["water-scout", "fire-smith", "wind-oracle", "earth-guard"]} selectedCharacterIds={["water-scout", "fire-smith", "wind-oracle", "earth-guard"]} onConfirm={vi.fn()} onNavigate={vi.fn()} />);
    expect(screen.getByText("3/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /開始遠征/ })).not.toBeDisabled();
  });
});
