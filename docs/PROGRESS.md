# 目前進度

最後更新：2026-08-25

## 工程與部署基礎

| 項目 | 狀態 | 備註 |
|---|---|---|
| React + TypeScript + Vite | ✅ 完成 | Browser SPA 基線可 build |
| Git repository | ✅ 完成 | `main` 已連到 GitHub |
| GitHub Actions CI | ✅ 完成 | typecheck / test / build |
| Cloudflare Worker / D1 | ✅ 完成 | Static Assets、`/api/health`、`save_slots` |
| CI 自動 migration / deploy | ✅ 完成 | GitHub runner 已成功執行 |

## 遊戲開發階段

| 階段 | 目標 | 狀態 |
|---|---|---|
| P0 | 52 張牌、抽 13、牌型、元素、三墩比較 | ✅ 核心完成 | 玩家排牌、AI 敵方、逐墩結果已接通 |
| P1 | 13 格花色模板與 current/original suit | ✅ 完成 | `template.ts` 與 13 格預覽 |
| P2 | 基因鏈掉落、預覽、不可逆融合、3/5/5 裝備 | ✅ Run 已接入第一 slice | 獎勵進入 Run 基因庫，鍊成與裝備會影響下一場牌局 |
| P3 | 可操作單場戰鬥、角色能力、敵 AI | 🟡 戰鬥完成、角色技能第一批接入 | 13 張批次分墩、敵 AI、三墩結果與節點回寫已接；水紋、風之預視、火花、四象、潮汐流轉、風行商人、石碑揭示與鍛造師保留素材已有 Run 內操作入口；其餘角色 Effect 待接 |
| P4 | Seed 地圖、節點、普通怪、Elite、Boss 路線 | ✅ Run 閉環完成第一版 | 路線、戰鬥／事件／獎勵、Boss、結算可走通 |
| P5 | Boss 規則、神器、探索事件 | 🟡 第一版已接入 | Boss 模板與三種規則已進戰鬥；事件骰會進入 Run phase，成功事件可在基因鏈／遺物間擇一，事件現在有總和／對子／順子三種目標，遺物會轉成三墩平手加成；其餘事件分歧與 Boss 內容待擴充 |
| P6 | Meta、角色、升星、圖鑑與 MVP 內容 | 🟡 基本 Meta 已接 | 水晶抽卡、角色收藏、重複轉印記已可用；升星、圖鑑、Skill Tree 尚未完成 |
| P7 | Save migration、錯誤紀錄、效能與 UX polish | 🟡 local-first 可續玩 | Meta 與 active Run 已接 IndexedDB；尚未完成 migration chain、錯誤紀錄與手機實機驗證 |

## 已驗證能力

1. 所有抽牌與事件亂數集中到 `SeededRandom`；模板牌分離 `originalSuit` / `currentSuit`。
2. 元素環、牌型優先序、敵 AI 合法分牌、基因鍊成與 3/5/5 裝備均由純函式測試覆蓋。
3. P0 合法提交會呼叫 `resolveBattle`，以固定敵方 seed 產生逐墩牌型／元素／勝負結果。
4. 角色能力已透過共用 `GameEffect` lifecycle 執行，效果只能在指定 phase 使用且同一 Run 不重複觸發。
5. 探索骰 domain 支援 deterministic D6、總和門檻與相同點數目標，但尚未由 Run event phase 呼叫。
6. 內容 validator 會檢查 ID、模板長度、掉落池、Boss 規則與鏈長。
7. Mobile-first 像素遊戲殼層已接入：原創營地場景、設施熱點、固定 HUD、短提示、底部拇指指令列與 safe-area RWD。
8. 角色收藏與本次出戰隊伍已分離；新帳號有預設角色，每趟 Run 支援 1～3 名出戰角色。
9. 營地熱點已導向隊伍／路線／鍊成；戰鬥從路線節點進入，不再放在常駐底部選單。
10. 十三支戰鬥支援原始牌序／點數／花色再點數排序，並可一次選 3 張或 5 張批次分墩與退回。
11. 戰鬥正式畫面已移除 seed 與實驗台語氣；手機操作規格記錄於 `docs/BATTLE_UI_UX.md`。
12. `RunSessionView` 將路線、戰鬥、獎勵、結算拆成 phase；`runRewards.ts` 集中節點獎勵規則。
13. 一趟 deterministic Run 已能從起點經過節點、領取水晶／基因鏈，走到 Boss 並完成結算；重整頁面可依 active Run 狀態恢復 route／battle／reward／settlement。
14. 玩家基因鏈現在真正進入 Run inventory；可在節點間開啟鍊成，裝備模板會改變下一場牌的 currentSuit。
15. 路線會顯示可達節點的怪物與可能掉落摘要；遠征中底部導覽鎖定，避免跳出 Run 造成狀態重置。
16. 最小角色抽卡已接入：100 水晶抽 1 次，新角色加入收藏，重複角色轉為角色印記。
17. 事件獎勵不再自動同時領取：成功事件提供基因鏈／遺物二選一，選項會正確寫回 Run inventory。
18. 15 件遺物各有可辨識的三墩平手加成，戰鬥桌會在確認牌局前顯示目前遺物效果。
- ✅ 風行商人已接入事件 phase，可消耗一次性 Effect 重擲本事件骰，並透過 `discoveredRunFlags` 持久化使用狀態。
- ✅ 石碑揭示已接入路線 phase，可由石碑製圖師查看下一層節點類型，並透過 `discoveredRunFlags` 持久化一次性使用狀態。
- ✅ 鍛造師已接入鍊成 phase；啟用後下一次確認融合會保留左鏈素材，讓能力產生可驗證的 Run 內資源差異。

## 遊戲化 UI system pass

- ✅ 路線改為垂直連線地圖：節點具備目前位置、可前往、已完成、未開放狀態，Boss 位於遠征頂端。
- ✅ 戰鬥改為敵方資訊／敵方意圖／本回合目標／十三支牌桌的場景層級，保留 3/5/5 行為與 Run 效果。
- ✅ 營地改為「RUN PREP／下一步／營地指揮台」語言，不再把玩家面對的主要內容命名為 facility。
- ✅ 隊伍改為「出戰隊列／角色名冊」編成畫面，明確呈現 1～3 人位置與待命槽。
- ✅ GameShell ribbon 依場景提供下一步提示，讓營地、隊伍、地圖、戰鬥使用同一套遊戲節奏。
- ✅ Run phase 會回報共用 HUD，route／battle／event／reward／workshop／settlement 不再共用錯誤的地圖提示。
- 🟡 仍需完成 390×844 的真實 screenshot QA；目前 Hermes preview 流程已驗證營地／隊伍／路線，獨立瀏覽器 viewport 受權限 blocker 限制。

## Mobile Pixel Shell v1

- ✅ mobile-first GameShell 與原創像素遠征營地。
- ✅ lossless WebP 素材與手機／平板／橫向 RWD。
- ✅ 30 個 test files、110 個 tests。
- ⚠️ 瀏覽器手機尺寸截圖因本輪 Windows sandbox refresh 錯誤未完成，已記錄於 `docs/MOBILE_PIXEL_UI_PLAN.md`。

## 資產流程參考

- ✅ 已納入 `docs/ASSET_PIPELINE_REFERENCE.md`，參考 Agent Sprite Forge 的 asset contract、可重用 bundle、deterministic cleanup、分層地圖與 QA metadata 方法。
- 🟡 目前仍使用營地與角色 WebP baked assets；角色／怪物／技能／遺物 bundle 尚未逐項建立。
- ⚠️ 不把 Godot／Unity scene handoff 或 Grok 專用 `$video2dsprite` 視為 Chain XIII 目前可用功能。

## 下一個人工審閱目標

1. 擴充神器與探索骰的內容分歧，讓更多事件目標與角色 Effect 影響事件結果。
2. 補齊其餘 Boss 規則、圖鑑掉落解鎖、升星與 Permanent Skill Tree，再做內容量與勝率 simulation。
3. 完成 390×844 真實 screenshot QA；目前仍受獨立瀏覽器 remote-debugging permission blocker 限制。
