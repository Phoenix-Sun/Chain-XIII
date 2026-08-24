export type GameView = "town" | "route" | "battle" | "workshop" | "development";
export type GameSpeed = 0 | 1 | 2;
export interface ResourceAmount { label: string; value: string; icon: string; tone: "gold" | "jade" | "violet"; }