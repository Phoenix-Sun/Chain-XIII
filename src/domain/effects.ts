import type { RunState } from "./run";

export type EffectPhase = "map-preview" | "battle-ready" | "fusion-preview" | "exploration" | "battle-resolved";

export interface EffectContext { phase: EffectPhase; run: RunState; sourceId: string; input?: unknown; }
export interface EffectResult { applied: boolean; run: RunState; messages: string[]; }
export interface GameEffect { id: string; phase: EffectPhase; canApply: (context: EffectContext) => boolean; apply: (context: EffectContext) => EffectResult; }

function flagFor(effectId: string): string { return `effect:${effectId}`; }

function flaggingEffect(id: string, phase: EffectPhase, message: string): GameEffect {
  return {
    id, phase,
    canApply: ({ run }) => !run.discoveredRunFlags.includes(flagFor(id)),
    apply: (context) => ({ applied: true, run: { ...context.run, discoveredRunFlags: [...context.run.discoveredRunFlags, flagFor(id)] }, messages: [message] }),
  };
}

export const EFFECTS: Record<string, GameEffect> = {
  "ability-map": flaggingEffect("ability-map", "map-preview", "石碑揭示了下一層的節點類型。"),
  "ability-sight": flaggingEffect("ability-sight", "battle-ready", "風之預視讓敵方模板多顯示一格。"),
  "ability-ripple": flaggingEffect("ability-ripple", "battle-ready", "水紋回響：本場可重新選擇一次一張牌的配置。"),
  "ability-forge": flaggingEffect("ability-forge", "fusion-preview", "鍛造師保留了融合預覽，不會直接消耗素材。"),
  "ability-shell": flaggingEffect("ability-shell", "battle-resolved", "岩甲守護：本次失敗保留一件 Run 內獎勵。"),
  "ability-flow": flaggingEffect("ability-flow", "battle-ready", "潮汐流轉：一個已形成的元素墩可調整一次。"),
  "ability-spark": flaggingEffect("ability-spark", "battle-ready", "火花決鬥：頭墩牌型比較獲得一次主動昇華機會。"),
  "ability-trade": flaggingEffect("ability-trade", "exploration", "風行商人的交換讓獎勵多一個候選。"),
  "ability-harmony": flaggingEffect("ability-harmony", "battle-ready", "四象協調：查看三墩元素成立條件。"),
};

export function executeEffect(effectId: string, context: EffectContext): EffectResult {
  const effect = EFFECTS[effectId];
  if (!effect) throw new Error(`找不到 Effect: ${effectId}`);
  if (effect.phase !== context.phase) return { applied: false, run: context.run, messages: [`${effectId} 不能在 ${context.phase} 階段使用`] };
  if (!effect.canApply(context)) return { applied: false, run: context.run, messages: [`${effectId} 本 Run 已使用`] };
  return effect.apply(context);
}
