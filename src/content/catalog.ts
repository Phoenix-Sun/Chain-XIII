import type { Suit } from "../domain/cards";
import type { GeneFactor, GeneChain } from "../domain/template";
import type { CharacterDefinition, ContentCatalog, ExplorationEventDefinition, MonsterDefinition, RelicDefinition } from "./types";
import { objectiveForEvent, objectiveLabel } from "../domain/exploration";

const SUITS: Suit[] = ["water", "fire", "wind", "earth"];
const factor = (index: number): GeneFactor => ({ suit: SUITS[index % SUITS.length], tier: (index % 3) + 1 as 1 | 2 | 3 });

export const characters: CharacterDefinition[] = [
  ["water-scout", "R", "water", "ability-ripple", "情報與控牌"], ["fire-smith", "R", "fire", "ability-forge", "鍊成與爆發"], ["wind-oracle", "SR", "wind", "ability-sight", "預測與重抽"],
  ["earth-guard", "R", "earth", "ability-shell", "容錯與防守"], ["tide-scholar", "SR", "water", "ability-flow", "元素轉位"], ["ember-duelist", "SR", "fire", "ability-spark", "頭墩突破"],
  ["gale-merchant", "SSR", "wind", "ability-trade", "掉落選擇"], ["stone-cartographer", "SR", "earth", "ability-map", "節點情報"], ["fourfold-master", "SSR", undefined, "ability-harmony", "三墩調度"],
].map(([id, rarity, specialization, activeAbilityId, role]) => ({ id: id as string, rarity: rarity as CharacterDefinition["rarity"], specialization: specialization as Suit | undefined, activeAbilityId: activeAbilityId as string, passiveAbilityIds: [], role: role as string }));

export const geneChains: GeneChain[] = [
  { id: "gene-water-fire-wind", factors: [factor(0), factor(1), factor(2)] }, { id: "gene-earth-water-fire", factors: [factor(3), factor(0), factor(1), factor(2), factor(3)] },
  { id: "gene-fire-wind-earth-water-fire", factors: [factor(1), factor(2), factor(3), factor(0), factor(1)] }, { id: "gene-wind-earth-water-fire-earth", factors: [factor(2), factor(3), factor(0), factor(1), factor(3)] },
  { id: "gene-boss-water-fire", factors: [factor(0), factor(1), factor(0)] }, { id: "gene-boss-earth-wind", factors: [factor(3), factor(2), factor(3)] },
];

function monster(id: string, kind: MonsterDefinition["kind"], index: number, bossRuleId?: string): MonsterDefinition {
  return { id, kind, template13: Array.from({ length: 13 }, (_, slot) => factor(slot + index)), dropChainPoolIds: geneChains.map((chain) => chain.id).slice(0, kind === "boss" ? 2 : kind === "elite" ? 3 : 2), aiProfileId: kind === "boss" ? "ai-boss" : kind === "elite" ? "ai-elite" : "ai-basic", bossRuleId, name: id.replaceAll("-", " ") };
}

export const monsters: MonsterDefinition[] = [
  ...Array.from({ length: 12 }, (_, index) => monster(`monster-normal-${index + 1}`, "normal", index)), ...Array.from({ length: 4 }, (_, index) => monster(`monster-elite-${index + 1}`, "elite", index + 12)),
  monster("boss-lava-turtle", "boss", 16, "boss-neutralize-earth"), monster("boss-storm-bird", "boss", 17, "boss-swap-slots"), monster("boss-deep-sea", "boss", 18, "boss-water-advantage"),
];
const RELIC_NAMES = ["赤曜前鋒", "雙月中堅", "沉星尾墩", "三相羅盤", "王冠火炬", "深潮印記", "裂地長釘", "四象核心", "晨星徽章", "暮色徽章", "交界護符", "天穹王座", "赤王之眼", "潮汐王冠", "大地脈輪"];
export const relics: RelicDefinition[] = Array.from({ length: 15 }, (_, index) => ({ id: `relic-${index + 1}`, rarity: index < 8 ? "common" : index < 13 ? "rare" : "legendary", passiveEffectIds: [`relic-effect-${index + 1}`], name: RELIC_NAMES[index] }));
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
export const catalog: ContentCatalog = { characters, monsters, geneChains, relics, events };
