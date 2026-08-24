# Chain XIII

豪廷 V3 花色鍊成版的 Browser SPA 開發基線。

## 技術基線

- React + TypeScript + Vite
- D3.js：目前用於 prototype 進度視覺化，未來可接戰鬥／Run telemetry
- Cloudflare Workers：提供 API 與 SPA static assets
- D1：已建立 migration skeleton，等確認 Cloudflare 帳號與資料庫後啟用
- GitHub Actions：Pull Request / `main` push 自動 typecheck、test、build；設定 Cloudflare secrets 後自動 deploy

## 本機開發

```bash
npm install
npm run dev
```

開啟 http://localhost:5173。

Worker 整合測試：

```bash
npm run dev:worker
```

Worker dry-run（不部署）：

```bash
npm run deploy:dry
```

## 常用檢查

```bash
npm run typecheck
npm test
npm run build
npm run check
```

## Cloudflare 部署

本專案採 Workers Static Assets。`wrangler.jsonc` 會把 `dist/` 發佈到 Worker，`/api/*` 先進入 Worker；目前已提供 `GET /api/health`。

第一次本機登入（不把 token 寫進 repo）：

```bash
npx wrangler login
npx wrangler whoami
npm run deploy
```

GitHub Actions 需要在 repository secrets 設定：

- `CLOUDFLARE_API_TOKEN`：限定 Workers deploy 權限的 API Token
- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare account ID

## D1 說明

企劃書寫的是 Browser SPA + IndexedDB 優先。`migrations/0001_initial.sql` 先保留第一個雲端 save slice；等確認使用 D1（Cloudflare SQL）而不是 D3.js（前端視覺化）後，再執行：

```bash
npx wrangler d1 create chain-xiii
# 將回傳的 database_id 寫入 wrangler.jsonc 的 d1_databases
npx wrangler d1 migrations apply chain-xiii --local
npx wrangler d1 migrations apply chain-xiii --remote
```

不要把 Cloudflare token、`.dev.vars` 或任何 secret commit 到 Git。
