import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RunRouteView from "./RunRouteView";

describe("RunRouteView", () => {
  it("only enables the connected next layer and advances after a click", () => {
    render(<RunRouteView />);
    const reachable = screen.getAllByRole("button", { name: /戰鬥|強敵|事件|獎勵/ }).filter((button) => !button.hasAttribute("disabled"));
    expect(reachable.length).toBeGreaterThan(0);
    fireEvent.click(reachable[0]);
    expect(screen.getByText(/下一步：/)).toBeInTheDocument();
  });

  it("gives each reachable node a location so same-type choices are distinguishable", () => {
    render(<RunRouteView />);
    const reachable = screen.getAllByRole("button", { name: /第 2 層・第/ }).filter((button) => !button.hasAttribute("disabled"));
    expect(reachable.length).toBeGreaterThan(0);
    expect(reachable[0]).toHaveAccessibleName(/第 2 層・第 1 格|第 2 層・第 2 格|第 2 層・第 3 格/);
  });

  it("does not expose internal monster ids in route labels", () => {
    render(<RunRouteView />);
    const routeNodes = screen.getAllByRole("button").filter((button) => button.classList.contains("route-node"));
    expect(routeNodes.every((button) => !/monster (normal|elite)|boss (lava|storm|deep)/.test(button.getAttribute("aria-label") ?? ""))).toBe(true);
  });

  it("previews an event objective before the player commits to that route", () => {
    render(<RunRouteView run={{
      seed: "event-preview",
      partyCharacterIds: ["water-scout"],
      map: {
        seed: "event-preview",
        startNodeId: "start",
        bossNodeId: "boss",
        nodes: [
          { id: "start", row: 0, column: 0, type: "battle", nextNodeIds: ["event"] },
          { id: "event", row: 1, column: 0, type: "event", eventId: "event-2", nextNodeIds: ["boss"] },
          { id: "boss", row: 2, column: 0, type: "boss", monsterId: "boss-lava-turtle", nextNodeIds: [] },
        ],
      },
      geneInventory: [],
      geneCapacity: 6,
      equippedGenes: {},
      relicIds: [],
      discoveredRunFlags: [],
      completedNodeIds: ["start"],
      claimedRewardNodeIds: [],
      earnedCrystals: 0,
      earnedGeneChainIds: [],
      currentNodeId: "start",
      finalBossId: "boss",
      status: "active",
    }} />);

    expect(screen.getByText(/目標：配置一組相同點數/)).toBeInTheDocument();
    expect(screen.getByText(/可能獎勵：水晶、基因鏈、遺物/)).toBeInTheDocument();
  });
});
