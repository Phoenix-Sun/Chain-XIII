import type { Suit } from "../domain/cards";
import type { GeneFactor, GeneChain, GeneSlot } from "../domain/template";
import type { CharacterDefinition, ContentCatalog, ExplorationEventDefinition, MonsterDefinition, RelicDefinition } from "./types";
import { objectiveForEvent, objectiveLabel } from "../domain/exploration";
import { blessings } from "../domain/blessings";

const SUITS: Suit[] = ["water", "fire", "wind", "earth"];
const factor = (suit: Suit): GeneFactor => ({ suit });
const indexedFactor = (index: number): GeneFactor => factor(SUITS[index % SUITS.length]);
const chain = (id: string, name: string, targetSlot: GeneSlot, suits: Suit[], enabledSlots = suits.map(() => true), description = "點選格子開關，決定哪些位置覆寫原本花色。") : GeneChain => ({ id, name, targetSlot, factors: suits.map(factor), enabledSlots, description });

export const characters: CharacterDefinition[] = [
  ["water-scout", "R", "water", "ability-ripple", "情報與控牌"], ["fire-smith", "R", "fire", "ability-forge", "鍊成與爆發"], ["wind-oracle", "SR", "wind", "ability-sight", "預測與重抽"],
  ["earth-guard", "R", "earth", "ability-shell", "容錯與防守"], ["tide-scholar", "SR", "water", "ability-flow", "元素轉位"], ["ember-duelist", "SR", "fire", "ability-spark", "頭墩突破"],
  ["gale-merchant", "SSR", "wind", "ability-trade", "掉落選擇"], ["stone-cartographer", "SR", "earth", "ability-map", "節點情報"], ["fourfold-master", "SSR", undefined, "ability-harmony", "三墩調度"],
].map(([id, rarity, specialization, activeAbilityId, role]) => ({ id: id as string, rarity: rarity as CharacterDefinition["rarity"], specialization: specialization as Suit | undefined, activeAbilityId: activeAbilityId as string, passiveAbilityIds: [], role: role as string }));

export const geneChains: GeneChain[] = [
  chain("gene-water-fire-wind", "水火風・前鋒", "short3", ["water", "fire", "wind"]),
  chain("gene-earth-water-fire", "地水火・中堅", "long5A", ["earth", "water", "water", "fire", "earth"], [false, true, true, false, true]),
  chain("gene-fire-wind-earth-water-fire", "火風地水火・尾陣", "long5B", ["fire", "wind", "earth", "water", "fire"]),
  chain("gene-wind-earth-water-fire-earth", "風地水火地・中堅", "long5A", ["wind", "earth", "water", "fire", "earth"]),
  chain("gene-boss-water-fire", "潮焰・前鋒", "short3", ["water", "water", "fire"]),
  chain("gene-boss-earth-wind", "岩風・前鋒", "short3", ["earth", "wind", "earth"]),
  chain("gene-tail-water-earth-wind-fire-water", "潮岩・尾陣", "long5B", ["water", "earth", "wind", "fire", "water"]),
];

function monster(id: string, kind: MonsterDefinition["kind"], index: number, bossRuleId?: string): MonsterDefinition {
  return { id, kind, template13: Array.from({ length: 13 }, (_, slot) => indexedFactor(slot + index)), dropChainPoolIds: geneChains.map((chain) => chain.id).slice(0, kind === "boss" ? 2 : kind === "elite" ? 3 : 2), aiProfileId: kind === "boss" ? "ai-boss" : kind === "elite" ? "ai-elite" : "ai-basic", bossRuleId, name: id.replaceAll("-", " ") };
}

export const monsters: MonsterDefinition[] = [
  ...Array.from({ length: 12 }, (_, index) => monster(`monster-normal-${index + 1}`, "normal", index)), ...Array.from({ length: 4 }, (_, index) => monster(`monster-elite-${index + 1}`, "elite", index + 12)),
  monster("boss-lava-turtle", "boss", 16, "boss-neutralize-earth"), monster("boss-storm-bird", "boss", 17, "boss-swap-slots"), monster("boss-deep-sea", "boss", 18, "boss-water-advantage"),
];
const RELIC_BLUEPRINTS: Array<Omit<RelicDefinition, "passiveEffectIds">> = [
  { id: "relic-1", rarity: "common", category: "battle", name: "赤曜前鋒", trigger: "戰鬥・頭墩同牌型比較", effect: "本場頭墩比較 +2～+4", detail: "本場數值在進入戰鬥時固定，只在頭墩牌型相同時加入比較。" },
  { id: "relic-2", rarity: "common", category: "battle", name: "雙月中堅", trigger: "戰鬥・中墩同牌型比較", effect: "本場中墩比較 +2～+4", detail: "本場數值在進入戰鬥時固定，只在中墩牌型相同時加入比較。" },
  { id: "relic-3", rarity: "common", category: "battle", name: "沉星尾墩", trigger: "戰鬥・尾墩同牌型比較", effect: "本場尾墩比較 +2～+4", detail: "本場數值在進入戰鬥時固定，只在尾墩牌型相同時加入比較。" },
  { id: "relic-4", rarity: "common", category: "battle", name: "三相羅盤", trigger: "戰鬥・三墩都有基因鏈", effect: "三墩同牌型比較各 +2", detail: "三個墩位都裝備至少一格啟用的基因鏈時生效。" },
  { id: "relic-5", rarity: "common", category: "battle", name: "王冠火炬", trigger: "戰鬥・短鏈全開", effect: "頭墩同牌型比較 +4", detail: "頭墩 3 格基因鏈全部啟用時生效。" },
  { id: "relic-6", rarity: "common", category: "battle", name: "深潮印記", trigger: "戰鬥・中鏈啟用 3 格以上", effect: "中墩同牌型比較 +3", detail: "中墩基因鏈至少啟用 3 格時生效。" },
  { id: "relic-7", rarity: "common", category: "battle", name: "裂地長釘", trigger: "戰鬥・尾鏈啟用 3 格以上", effect: "尾墩同牌型比較 +3", detail: "尾墩基因鏈至少啟用 3 格時生效。" },
  { id: "relic-8", rarity: "common", category: "battle", name: "四象核心", trigger: "戰鬥・保留原色", effect: "含停用基因格的墩位比較 +2", detail: "每個含有停用基因格的墩位，同牌型比較 +2。" },
  { id: "relic-9", rarity: "rare", category: "battle", name: "熔岩破印", trigger: "戰鬥・對熔岩巨龜", effect: "尾墩地元素保留克制效果", detail: "對熔岩巨龜時，尾墩地元素不會被 Boss 特性中和。" },
  { id: "relic-10", rarity: "rare", category: "battle", name: "風暴破印", trigger: "戰鬥・對風暴巨鳥", effect: "阻止敵方牌位互換", detail: "對風暴巨鳥時，敵方不會在開戰時互換模板位置。" },
  { id: "relic-11", rarity: "rare", category: "battle", name: "深海破印", trigger: "戰鬥・對深海巨獸", effect: "取消 Boss 頭墩水域優勢", detail: "對深海巨獸時，頭墩水元素不會觸發 Boss 的額外壓制。" },
  { id: "relic-12", rarity: "rare", category: "battle", name: "留白王座", trigger: "戰鬥・三墩都保留原色", effect: "三墩同牌型比較各 +3", detail: "三個墩位都至少停用一格基因格時生效。" },
  { id: "relic-13", rarity: "rare", category: "battle", name: "前後回聲", trigger: "戰鬥・前後基因鏈同時啟用", effect: "頭墩與尾墩比較各 +3", detail: "頭墩與尾墩都裝備至少一格啟用的基因鏈時生效。" },
  { id: "relic-14", rarity: "legendary", category: "battle", name: "中堅王座", trigger: "戰鬥・中鏈全開", effect: "中墩同牌型比較 +4", detail: "中墩 5 格基因鏈全部啟用時生效。" },
  { id: "relic-15", rarity: "legendary", category: "battle", name: "原始牌勢", trigger: "戰鬥・未裝備尾鏈", effect: "尾墩同牌型比較 +3", detail: "尾墩沒有裝備基因鏈時生效；純原始牌組也能形成 Build。" },
  { id: "relic-16", rarity: "rare", category: "altar", name: "無光護符", trigger: "遺物祭壇・第一次 Skull", effect: "第一次 Skull 只鎖定，不增加爆骰計數", detail: "Skull 仍會佔住骰位，但這趟祭壇多一次試探空間。" },
  { id: "relic-17", rarity: "rare", category: "altar", name: "收手印", trigger: "遺物祭壇・形成小獎勵後", effect: "已形成的水晶／祝福獎勵不會因爆骰失去", detail: "遺物三連資格仍然會在爆骰時失去；它只保護已形成的小獎勵。" },
  { id: "relic-18", rarity: "rare", category: "route", name: "星圖碎片", trigger: "遠征地圖・下一層預覽", effect: "直接查看下一層節點類型", detail: "不消耗角色技能，也不改變路線，只讓風險選擇更透明。" },
  { id: "relic-19", rarity: "legendary", category: "economy", name: "戰利品印章", trigger: "戰鬥勝利・未使用角色主動技", effect: "額外取得 6 水晶", detail: "鼓勵玩家用遺物與牌局完成戰鬥，而不是每場都依賴主動技。" },
];
export const relics: RelicDefinition[] = RELIC_BLUEPRINTS.map((relic) => ({ ...relic, passiveEffectIds: [relic.id.replace("relic-", "relic-effect-")] }));
const EVENT_BLUEPRINTS = [
  ["破曉水井", "老井裡傳出水聲，只有足夠響亮的回音才能叫醒守井人。", "井水重新流動，守井人交出一段珍貴素材。", "回音太弱，守井人只留下幾枚水晶。"],
  ["斷橋骰局", "斷橋對岸的路標搖搖欲墜；橋板只會在正確的點數排列下亮起。", "橋板一塊接一塊亮起，你安全穿過斷橋。", "橋板沒有回應，你繞路離開，仍保住少量水晶。"],
  ["風中的三枚石", "三枚石頭被風捲上半空，連成正確的順序就能標出山谷出口。", "石頭排成一線，風替你指出通往高地的路。", "石頭散落在草叢裡，你只能沿著舊路前進。"],
  ["灰燼郵差", "灰燼裡埋著一封未送出的信，附近的烽火等待一個成對的暗號。", "暗號被辨認出來，遠方營地替你點亮補給信標。", "暗號無法配對，你在煙霧散去前收起信件。"],
  ["沉睡石像", "石像胸口嵌著四枚骰痕，足夠的震動才能讓它吐出古代零件。", "石像甦醒並吐出零件，還替你指向下一個遺跡。", "石像沒有醒來，你只在裂縫裡找到零星水晶。"],
  ["潮聲祭壇", "潮聲祭壇把每一次投擲都記在石面上，連續的點數能喚回退潮路徑。", "退潮路徑重新浮現，你從暗礁間找到安全通道。", "潮水蓋過石面，你只來得及帶走水晶。"],
  ["荒原信標", "荒原信標忽明忽滅，守望者要確認一個足夠高的總和才會開門。", "信標完全亮起，守望者分享了遠征隊的補給。", "信標再次熄滅，你從門縫取得幾枚水晶。"],
  ["雙生獵痕", "兩道獵痕在岩壁上交疊，只有相同的點數能讓追蹤印記顯形。", "追蹤印記顯形，你避開伏擊並找到近路。", "印記沒有顯形，你沿著安全的河床離開。"],
  ["雲梯殘片", "雲梯殘片飄在半空，連續的點數會讓碎片暫時固定。", "雲梯恢復片刻，你攀上高處看見 Boss 領域的輪廓。", "雲梯再次崩散，你從低處繞行並保留水晶。"],
  ["赤砂商約", "赤砂商人不收金錢，只接受足以證明膽量的投擲結果。", "商人打開封存箱，讓你從危險路段帶走一份素材。", "商人搖頭離去，你至少拿回了路費。"],
  ["月影棋盤", "月影在石盤上切成三格，重複的點數能讓隱藏格線現形。", "格線現形，你找到一枚能改變牌局的遺物。", "格線消失，你在月光下撿到幾枚水晶。"],
  ["王域前哨", "Boss 領域前的哨站要求連續點數作為通行暗號。", "哨兵放下武器，告訴你 Boss 的第一個戰鬥習慣。", "暗號錯了，哨兵驅離你，但沒有追出前哨。"],
] as const;
export const events: ExplorationEventDefinition[] = EVENT_BLUEPRINTS.map(([name, content, successText, failureText], index) => {
  const objective = objectiveForEvent(`event-${index + 1}`);
  return { id: `event-${index + 1}`, name, content, objective: objectiveLabel(objective), successText, failureText, rewardIds: [geneChains[index % geneChains.length].id, relics[index % relics.length].id] };
});
export const catalog: ContentCatalog = { characters, monsters, geneChains, relics, blessings, events };
