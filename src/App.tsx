import type { ReactNode } from "react";
import "./game/game.css";
import "./game/workshop.css";
import "./game/route.css";
import "./game/battle.css";
import GameShell from "./game/GameShell";
import TownView from "./game/TownView";
import RunRouteView from "./game/RunRouteView";
import GeneWorkshopView from "./game/GeneWorkshopView";
import DevelopmentView from "./game/DevelopmentView";
import BattleArenaView from "./features/p0/BattleArenaView";
import type { GameView } from "./game/types";

const views: Record<GameView, ReactNode> = {
  town: <TownView />,
  route: <RunRouteView />,
  battle: <BattleArenaView />,
  workshop: <GeneWorkshopView />,
  development: <DevelopmentView />,
};

export default function App() {
  return <GameShell views={views} />;
}