import "./game/game.css";
import "./game/workshop.css";
import "./game/route.css";
import "./game/battle.css";
import "./game/party.css";
import "./game/run.css";
import GameShell from "./game/GameShell";

export default function App({ initialSeed }: { initialSeed?: string } = {}) {
  return <GameShell initialSeed={initialSeed} />;
}