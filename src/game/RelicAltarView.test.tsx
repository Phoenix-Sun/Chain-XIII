import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RelicAltarView from "./RelicAltarView";
import { createRelicAltarState } from "../domain/relicAltar";

describe("RelicAltarView", () => {
  it("shows five dice and the fixed Skull risk after the first roll", () => {
    render(<RelicAltarView seed="ui-altar" relicIds={[]} candidateRelicIds={["relic-1", "relic-2"]} onResolved={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "投擲五顆骰子" }));
    expect(screen.getByLabelText("五顆遺物祭壇骰子").querySelectorAll("button")).toHaveLength(5);
    expect(screen.getByRole("status")).toHaveTextContent(/Skull：\d \/ 3/);
    expect(screen.getByRole("button", { name: "收手並保留成果" })).toBeInTheDocument();
  });

  it("can resume a saved bust and applies the visible curse outcome", () => {
    const state = { ...createRelicAltarState("saved-altar", ["relic-1", "relic-2"]), status: "bust" as const, skullCount: 3, faces: ["skull", "skull", "skull", "crystal", "blessing"] as Array<"crystal" | "relic" | "blessing" | "skull"> };
    const onResolved = vi.fn();
    render(<RelicAltarView seed="saved-altar" relicIds={[]} initialState={state} candidateRelicIds={state.candidateRelicIds} onResolved={onResolved} />);
    fireEvent.click(screen.getByRole("button", { name: "承受詛咒並離開" }));
    expect(onResolved).toHaveBeenCalledWith(expect.objectContaining({ status: "bust", nextBattleSkullCurse: 1 }), undefined);
  });
});
