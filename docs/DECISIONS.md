# 架構決策紀錄

## ADR-001：以 React + Vite 作為 Browser SPA 基線

- 狀態：採用
- 原因：符合 MVP 文件的 Browser SPA 目標，開發與本機 smoke test 速度快。

## ADR-002：Cloudflare Workers Static Assets 作為部署入口

- 狀態：採用
- 原因：同一個 Worker 可處理 `/api/*`，其餘請求交給 SPA 靜態資產；避免前端與 API 分開管理。

## ADR-003：D1 作為雲端持久化資料庫

- 狀態：採用
- 資料庫：`chain-xiii`
- 原因：D1 是 Cloudflare 的 SQLite 資料庫，適合存放 save slots、MetaState 與未來的非即時遊戲資料。
- 注意：MVP 仍維持 IndexedDB local-first；D1 接入採逐步增加，不把所有本機狀態一次改成遠端依賴。

## ADR-004：GitHub Actions 作為外部 CI/CD

- 狀態：採用
- 流程：驗證 → D1 migrations → Worker deploy
- 原因：Git commit、Pull Request、測試與部署集中在 GitHub；跨電腦開發時可從 Actions 取得一致的驗證結果。
- 機密：Cloudflare API Token 只放 GitHub Secrets，不放 repository。

## ADR-005：`docs/` 追蹤非機密協作資訊

- 狀態：採用
- 原因：開發紀錄、進度與檢核表需要隨 Git 同步，避免只存在單一電腦或聊天紀錄。
- 限制：不得記錄 token、密碼、私鑰、`.env`、`.dev.vars` 或私人帳務資訊。

## ADR-006：畫面採 Kairosoft 風格、流程採卡牌 Roguelike

- 狀態：採用
- 畫面方向：可愛、清楚、手機優先的像素場景與短回饋；營地只作為遠征流程入口，不做城市經營。
- 流程方向：營地 → 選隊伍 → 選路線 → 戰鬥／事件／獎勵 → 鍊成 → 繼續前進 → Boss。
- 原因：保留 Kairosoft 式場景親和力，同時讓玩家像 Slay the Spire 一樣一次只處理當前決策。

## ADR-007：角色收藏與出戰隊伍分離

- 狀態：採用
- 新帳號：至少有 1 名預設角色。
- 角色取得：玩家透過遊戲取得水晶並抽卡，可能在第一趟 Run 前就擁有多名角色。
- 出戰規則：每趟 Run 從已擁有角色中選 1～3 名；3 人是隊伍上限，不是固定的新手解鎖順序。
- 原因：符合角色抽卡遊戲的長期循環，也避免劇情與玩家實際抽卡結果互相矛盾。

## ADR-008：以 RunSession phase 協調一趟完整遠征

- 狀態：採用
- phase：`route`、`battle`、`reward`、`settlement`。
- Domain：`RunState` 只處理節點移動、完成、失敗與獎勵領取；`runRewards.ts` 集中節點獎勵規則。
- UI：`RunRouteView`、`BattleArenaView`、`RunRewardView`、`RunSettlementView` 各自只處理一種主要任務。
- 原因：讓一趟 Run 可以完整走到 Boss，同時避免把節點規則、戰鬥結果與 Meta 回寫全部塞進 `GameShell`，方便後續加入事件、商店、抽卡與存檔續玩。

## ADR-009：active Run 由 GameShell 持有並 local-first 保存

- 狀態：採用
- `GameShell` 持有 `activeRun` 與 `MetaState`；`RunSessionView` 只負責 phase 協調，透過 `onRunUpdated` 回傳新的純資料狀態。
- IndexedDB slot `default` 保存 versioned `SaveEnvelope`，包含 Meta 與未完成 Run；重新載入時依當前節點與完成／領獎狀態重建 phase，不保存 React UI state。
- 遠征進行中鎖住營地、抽卡與全域鍊成導覽；鍊成只從 Run route 的節點間入口進入，避免繞過單向流程或重置 Run。
- 原因：修正 view unmount 造成 Run 遺失的風險，同時保留未來 D1 cloud save 的 service 邊界。

## ADR-010：Run 分成三章，每章以特殊遭遇收束（已修訂）

- 狀態：被 ADR-011 取代
- 節點長度：第 1 章 10～13 個節點、第 2 章 7～9 個節點、第 3 章 4～6 個節點；每章最後一個節點固定是 Boss。
- 路線：三章共用一條 forward-only 地圖，但章末 Boss 完成後仍維持 `active`，領取獎勵後進入下一章；只有第三章 Boss 才將 Run 標記為 `won`。
- 強度：第 2／3 章提高 Elite 節點權重，並在同牌型平手比較給予敵方 +1／+2 章節加成。
- Save：chapter Boss IDs 與章節長度寫入 RunMap；save version 4 會為舊 active Run 補上相容欄位。
- 原因：讓遠征有清楚的三段節奏、三場 Boss 戰與後期難度曲線，而不是單一 16 層隨機路線。

## ADR-011：章末菁英／Boss 使用候選十三支牌組決定強度

- 狀態：採用
- 節點分布：一般路徑只生成普通戰鬥、事件與遺物；第 1、2 章最後固定為 Elite，第 3 章最後固定為 Boss。
- 候選牌組：普通戰鬥使用 1 組 13 張牌；Elite 產生 2 組候選牌；Boss 產生 3 組候選牌。每組候選都使用既有合法 3／5／5 分牌與牌型判定，再以尾墩、 中墩、頭墩的牌型階級與同牌型 tiebreaker 進行字典序比較，選出較高階組合。
- 決定性：候選牌組 seed 包含 Run seed、節點 ID 與候選索引；同一趟 Run 重新載入時會得到相同候選，不依玩家當局牌面作弊調整。
- 失敗懲罰：普通戰鬥扣 1 點命數，Elite 扣 2 點命數，Boss 直接清空剩餘命數；命數歸零進入 lost settlement。
- 獎勵：第 1、2 章 Elite 完成後照常領取水晶與基因鏈並回到 route；只有第 3 章 Boss 完成才進入 won settlement。難度獎勵倍率維持容易 0.75x、中等 1.00x、困難 1.50x。
- 章節平手加成：候選牌組成為主要強度來源後，章節微調改為第 1 章 +0、第 2 章 +0、第 3 章 +1，只在牌型與元素都未分出勝負時使用。
- Save：RunMap 使用 `chapterEndNodeIds`；save version 5 能將 version 4 的舊 `chapterBossNodeIds` 轉為相容欄位。
- 原因：讓 Elite 與 Boss 的強度來自可理解的牌面結構，而不是只有模糊數值加成；即使 Boss 失敗，前兩章獲得的水晶仍能推動 Meta 成長。
