import type { ContentCatalog } from "./types";

export function validateContentCatalog(catalog: ContentCatalog): string[] {
  const errors: string[] = [];
  const allIds = [...catalog.characters, ...catalog.monsters, ...catalog.geneChains, ...catalog.relics, ...catalog.events].map((item) => item.id);
  if (new Set(allIds).size !== allIds.length) errors.push("內容 ID 必須唯一");
  for (const monster of catalog.monsters) {
    if (monster.template13.length !== 13) errors.push(`${monster.id} template 必須是 13 格`);
    if (monster.dropChainPoolIds.length === 0) errors.push(`${monster.id} 掉落池不可為空`);
    if (monster.kind === "boss" && !monster.bossRuleId) errors.push(`${monster.id} 缺少 bossRuleId`);
  }
  for (const chain of catalog.geneChains) if (![3, 5].includes(chain.factors.length)) errors.push(`${chain.id} 只能是 3 或 5 格鏈`);
  for (const event of catalog.events) if (event.rewardIds.length === 0) errors.push(`${event.id} 必須有獎勵`);
  return errors;
}
