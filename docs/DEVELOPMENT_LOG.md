# Chain XIII 開發紀錄

## 2026-08-24

### 基礎工程

- 建立 React + TypeScript + Vite Browser SPA 基線。
- 建立 Vitest 測試環境與第一個 shell render test。
- 保留 `MVP開發文件_v0.1.md` 作為目前遊戲設計基線。
- 加入 D3.js prototype 進度圖。

### GitHub

- Repository：<https://github.com/Phoenix-Sun/Chain-XIII>
- 預設分支：`main`
- GitHub Actions workflow：`.github/workflows/ci.yml`
- Pull Request 與 Dependabot 設定已加入。

### Cloudflare

- 建立 Workers Static Assets 部署入口。
- Worker URL：<https://chain-xiii.napoleon-sun.workers.dev>
- `GET /api/health` 可檢查 Worker 與 D1 連線。
- 建立 D1 database：`chain-xiii`。
- 建立並套用 migration：`migrations/0001_initial.sql`。
- 第一張資料表：`save_slots`。
- 遠端驗證結果：`d1.connected = true`、`d1.saveSlotsTable = true`。

### CI/CD

- Pull Request 與 `main` push 會執行 typecheck、test、build。
- 有 Cloudflare API Token 後，`main` push 的部署順序為：
  1. 驗證專案
  2. 套用 D1 remote migrations
  3. 部署 Cloudflare Worker
- `CLOUDFLARE_ACCOUNT_ID` 已加入 GitHub repository secret。
- `CLOUDFLARE_API_TOKEN` 已加入 GitHub repository secret，內容未讀取或寫入 repository。
- GitHub Actions end-to-end run：<https://github.com/Phoenix-Sun/Chain-XIII/actions/runs/32710438621>
- GitHub runner 已成功完成 D1 migration、frontend build 與 Worker deploy。

### 驗證

- `npm run check`：通過
- `npm run deploy:dry`：通過，Worker 讀到 `env.DB` 與 `env.ASSETS`
- remote D1 查詢 `save_slots`：通過
- production Worker health smoke test：通過

### P0 手機優先垂直切片

- 實作 52 張標準牌、seed 可重現洗牌與抽 13。
- 實作 3 張頭墩、5 張中墩、5 張尾墩的 layout validation。
- 實作 3 張與 5 張牌型評估、同類牌型 tie-breaker 與順子／同花順。
- 建立 14 個規則與 UI 測試，全部通過。
- 建立手機優先 P0 實驗台：點選牌、放入墩位、退回手牌、即時牌型提示與合法性提示。
- CSS 以 mobile-first 為預設，桌面在 560px / 860px 以上逐步擴展。
