import type { ContentCatalog } from "./types";

export function validateContentCatalog(catalog: ContentCatalog): string[] {
  const errors: string[] = [];
  const allIds = [...catalog.characters, ...catalog.monsters, ...catalog.geneChains, ...catalog.relics, ...catalog.events].map((item) => item.id);
  const geneIds = new Set(catalog.geneChains.map((chain) => chain.id));
  const relicIds = new Set(catalog.relics.map((relic) => relic.id));
  const bossRules = new Set(["boss-neutralize-earth", "boss-swap-slots", "boss-water-advantage"]);
  if (new Set(allIds).size !== allIds.length) errors.push("內容 ID 必須唯一");
  for (const monster of catalog.monsters) {
    if (monster.template13.length !== 13) errors.push(`${monster.id} template 必須是 13 格`);
    if (monster.dropChainPoolIds.length === 0) errors.push(`${monster.id} 掉落池不可為空`);
    if (monster.dropChainPoolIds.some((id) => !geneIds.has(id))) errors.push(`${monster.id} 掉落池含不存在的基因鏈`);
    if (monster.kind === "boss" && !monster.bossRuleId) errors.push(`${monster.id} 缺少 bossRuleId`);
    if (monster.bossRuleId && !bossRules.has(monster.bossRuleId)) errors.push(`${monster.id} 含未知 Boss 規則`);
  }
  for (const chain of catalog.geneChains) if (![3, 5].includes(chain.factors.length)) errors.push(`${chain.id} 只能是 3 或 5 格鏈`);
  for (const event of catalog.events) {
    if (!event.name.trim()) errors.push(`${event.id} 缺少事件名稱`);
    if (!event.content.trim()) errors.push(`${event.id} 缺少事件內容`);
    if (!event.successText.trim()) errors.push(`${event.id} 缺少成功結果文字`);
    if (!event.failureText.trim()) errors.push(`${event.id} 缺少失敗結果文字`);
    if (event.rewardIds.length === 0) errors.push(`${event.id} 必須有獎勵`);
    if (event.rewardIds.some((id) => !geneIds.has(id) && !relicIds.has(id))) errors.push(`${event.id} 含不存在的獎勵 ID`);
  }
  return errors;
}
