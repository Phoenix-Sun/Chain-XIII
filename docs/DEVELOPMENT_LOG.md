# Chain XIII 開發紀錄

## 2026-08-24

### 基礎工程與像素介面

- 建立 React + TypeScript + Vite Browser SPA、Vitest、GitHub Actions、Cloudflare Worker、D1 `save_slots` migration 與部署 smoke test。
- 依開羅遊戲公開畫面與訪談整理固定 HUD、像素場景、底部主選單、短訊息回饋與 data-driven view 架構。
- 新增 `GameShell`、領地像素地圖、Seed 節點路線、開發卷宗與 pixel UI styles。
- 研究結論寫入 `docs/PIXEL_UI_FOUNDATION.md`。

### P0 / P1 / P2

- 所有抽牌亂數集中到 `SeededRandom`，並以 `originalSuit`／`currentSuit` 保留花色改造前後狀態。
- 新增元素克制、水 → 火 → 風 → 地 → 水、墩屬性判定、三墩逐墩比較與整場勝負服務。
- 新增 13 格模板建構與套用；模板不覆寫原始牌實體身份。
- 新增基因鏈預覽／確認鍊成、同接點升階、異接點串接、前端擠出與 3/5/5 裝備限制。
- 新增花色鍊成工房 UI，可操作預覽、不可逆確認、換裝與 13 張 current suit preview。

### P3 / P4 / content / save

- 新增可測試敵方 AI，從 13 張牌搜尋合法 3/5/5 排列。
- P0 合法提交現在會呼叫 `resolveBattle`，以固定敵方 seed 產生三墩結果，UI 顯示牌型、元素與勝負理由。
- 新增共用 `GameEffect` lifecycle；9 名角色 catalog 的 active ability ID 可在指定 phase 執行並寫回 RunState。
- 新增 deterministic D6 exploration service，支援總和門檻、pair 與 straight 目標。
- 新增 seed-driven forward-only Run map 與可操作路線 UI，終點公開 Boss。
- 新增 data-driven catalog：9 角色、12 普通怪、4 Elite、3 Boss、15 神器、12 事件；加入 catalog validator。
- 新增 `RunState`、`MetaState`、versioned `SaveEnvelope`、JSON migration boundary 與 IndexedDB adapter。

### 驗證

- `tsc -b --pretty false`：通過。
- Vitest：21 個 test files、45 個 tests 通過。
- Vite production build：通過。
- `git diff --check`：通過。
- 架構掃描：未發現 `Math.random()`、暫存 `next.tsx` 或 UI 內直接埋入核心規則的遺留。

### 下一步

- 讓 Run 節點觸發戰鬥／事件／神器並保存到 IndexedDB。
- 補 Boss 招牌規則與一次探索骰 UI，完成第一個可走到結算的 Seed Run。
- 建立最小 Meta Hub 與三人隊伍選擇。

### Mobile Pixel Shell v1

- 依 Kairosoft 官方 Android／iOS 列表與官方商店頁面研究手機 UI：場景優先、固定資源 HUD、底部拇指操作、短面板回饋與觸控縮放。
- 以原創像素城鎮圖取代 CSS 方塊地圖，加入三個設施熱點、選取狀態、設施資訊、角色對話與立即回饋。
- GameShell 改為 `100dvh` mobile-first 遊戲視窗，支援 safe-area、極小手機、平板／桌機與低高度橫向 RWD。
- 遠征改為獨立底部指令，不再與城鎮上下堆成長網頁。
- 生成素材轉成 lossless WebP，約由 4.31 MB 降至 2.83 MB；未提交的 PNG 副本已移除。
- 新增 `docs/MOBILE_PIXEL_UI_PLAN.md`，記錄設計依據、斷點規格、完成範圍與下一階段。
- 驗證更新為 22 個 test files、48 個 tests；typecheck 與 production build 通過。
- 瀏覽器手機尺寸截圖因 Windows sandbox refresh 錯誤未完成，明列為下一階段第一個 QA 任務。

## 2026-08-25

### 角色隊伍與十三支手機操作收斂

- 將角色收藏 `ownedCharacterIds` 與本次出戰 `partyCharacterIds` 分離；Run 隊伍改為可選 1～3 名，不再假設每位玩家開局固定三人。
- 營地、隊伍、路線、戰鬥與鍊成改用白話詞彙，移除玩家畫面上的 seed、節點 ID 與實驗台語氣。
- 新增 `docs/BATTLE_UI_UX.md`：手牌可依原始牌序、點數、花色／點數排序；選取 3 張或 5 張後一次歸入指定墩位；同一墩可多選後退回手牌。
- P0 戰鬥 UI 改為手機優先的多選批次分墩，加入選取順序標記、張數提示、排序控制與合法性回饋。

### 驗證

- `npm run typecheck`：通過。
- `npm test -- --reporter=verbose`：23 個 test files、57 個 tests 通過。
- `git diff --check`：通過。

## 2026-08-25

### 完整 Run MVP 閉環

- 新增 `runRewards.ts`，集中普通戰鬥、事件、獎勵、強敵與 Boss 的水晶／基因鏈獎勵規則。
- 擴充 `RunState`：已完成節點、已領獎節點、Run 內水晶與基因鏈，並加入 Boss won／戰鬥 loss 狀態轉移。
- 新增 `RunSessionView`、`RunRewardView`、`RunSettlementView`，將路線、戰鬥、領獎與結算拆成獨立模組。
- 路線節點現在會實際觸發對應 phase；事件／獎勵節點不再讓玩家卡在路線畫面；Boss 勝利後可進入結算。
- `GameShell` 持有 active Run 與 Meta，Run phase 透過 callback 回寫純狀態；戰鬥與獎勵細節仍不塞回 shell。

### 驗證

- deterministic domain simulation：可從起點一路完成至 Boss。
- `npm test -- --reporter=dot`：24 個 test files、62 個 tests 通過。

## 2026-08-25

### 規格審閱與核心狀態修正

- 修正 `Card` 的 `originalSuit`／`currentSuit` 資料，讓實際戰鬥 UI、牌型、元素與排序都能使用套用後花色，同時保留原始牌面。
- `BattleArenaView` 現在依 Run seed 與節點抽牌，套用玩家裝備模板與怪物 13 格模板；熔岩巨龜的尾墩地元素中和規則已進入比較。
- `RunState` 提升到 `GameShell`，遠征中鎖定營地／鍊成／抽卡導覽；Meta 與 active Run 透過 IndexedDB 自動保存。
- Run reward 的基因鏈不再只顯示 ID，會進入基因庫；容量滿時可只領水晶並放棄基因鏈，不會卡死。
- 節點之間可直接開啟鍊成，鍊成／裝備結果會回寫 Run 並影響下一場戰鬥。
- 新增最小角色抽卡：100 水晶消耗、新角色入收藏、重複角色轉角色印記。
- 路線新增可達節點的怪物與掉落摘要；16 層 deterministic map 對齊規格的 15–18 節點 Run 目標；續玩時依 RunState 重建 route／battle／reward／settlement phase。

### 審閱結論

- 角色 active Effect、神器、探索骰 UI、其餘 Boss 規則、怪物圖鑑、升星與 Permanent Skill Tree 仍未視為完成；catalog 或 domain foundation 不再等同於玩家可用功能。

## 2026-08-25

### Agent Sprite Forge 資產流程參考

- 讀取 `0x0funky/agent-sprite-forge` 的繁中 README，將其可重現資產流程納入 Chain XIII 開發參考。
- 採用 asset contract、可重用 sprite bundle、raw → cleanup → frame → metadata → QA 的思路，以及 base／props／placement／zones 的分層地圖概念。
- 依 Chain XIII 的 Web 架構排除直接採用 Godot／Unity scene handoff；`$video2dsprite` 因依賴 Grok Build 的 `image_to_video`，目前不列為可用工具。
- 新增 `docs/ASSET_PIPELINE_REFERENCE.md`，記錄適用範圍、資產優先順序、授權與安全邊界。

### 2026-08-25：遊戲化 UI system pass

- 將遠征路線由節點清單重組為垂直連線地圖，保留 domain map 與 RunState，不以引擎遷移取代 UX 重做。
- 將戰鬥外層由 P0 實驗台重組為敵方資訊、敵方意圖、本回合目標與十三支牌桌；3/5/5、active effect、Boss rule 與持久化邏輯維持原路徑。
- 將營地入口重組為 RUN PREP 場景與單一「下一步／指揮台」；將隊伍入口重組為出戰隊列、待命槽與角色名冊。
- GameShell ribbon 依目前畫面提供場景目標，避免每個畫面只顯示泛用的「選擇目前要處理的事情」。
- RunSessionView 會將 route／battle／exploration／reward／workshop／settlement phase 回報給 GameShell，共用 HUD 會同步顯示正確的下一步。
- Hermes preview 實際驗證營地 → 隊伍 → 遠征地圖 → 遺物 → 領取獎勵；完整品質閘門為 29 test files、97 tests、typecheck、build 通過。
- 390×844 的獨立瀏覽器截圖仍受 remote-debugging permission blocker 限制，未將該部分宣稱完成。