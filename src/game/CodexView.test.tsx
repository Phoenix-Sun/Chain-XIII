import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CodexView from "./CodexView";
import { createEmptyMeta } from "../domain/save";

describe("CodexView", () => {
  it("shows discovered monsters with their battle rules and keeps unknown entries obscured", () => {
    const meta = { ...createEmptyMeta(), unlockedMonsterCodexIds: ["monster-normal-1", "boss-lava-turtle"] };
    render(<CodexView meta={meta} />);

    expect(screen.getByRole("heading", { name: "怪物圖鑑" })).toBeInTheDocument();
    expect(screen.getByText("普通怪物 1")).toBeInTheDocument();
    expect(screen.getByText("Boss・熔岩巨龜")).toBeInTheDocument();
    expect(screen.getAllByText("尚未遭遇").length).toBeGreaterThan(0);
    expect(screen.getByText(/尾墩形成地元素/)).toBeInTheDocument();
  });

  it("summarizes permanent relic collection separately from monster discoveries", () => {
    const meta = { ...createEmptyMeta(), relicIds: ["relic-1", "relic-8"] };
    render(<CodexView meta={meta} />);

    expect(screen.getByRole("heading", { name: "遺物收藏" })).toBeInTheDocument();
    expect(screen.getByText("赤曜前鋒")).toBeInTheDocument();
    expect(screen.getByText("四象核心")).toBeInTheDocument();
    expect(screen.getByText(/已發現 2 \/ 19/)).toBeInTheDocument();
    expect(screen.getByText("本場頭墩比較 +2～+4")).toBeInTheDocument();
    expect(screen.getByText("含停用基因格的墩位比較 +2")).toBeInTheDocument();
  });
});
