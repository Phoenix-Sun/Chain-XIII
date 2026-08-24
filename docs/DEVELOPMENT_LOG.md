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
