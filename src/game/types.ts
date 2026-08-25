export type GameView = "town" | "party" | "route" | "battle" | "workshop" | "gacha" | "codex";
export type Navigate = (view: GameView) => void;
import type { ReactNode } from "react";

export type GameViewFactory = (navigate: Navigate) => ReactNode;