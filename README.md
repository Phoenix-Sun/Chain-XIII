# Chain XIII

豪廷 V3 花色鍊成版的 Browser SPA 開發基線。

## 技術基線

- React + TypeScript + Vite
- D3.js：目前用於 prototype 進度視覺化，未來可接戰鬥／Run telemetry
- Cloudflare Workers：提供 API 與 SPA static assets
- D1：`chain-xiii` 已建立並綁定 Worker，migration 會在 CI/CD 部署前自動套用
- GitHub Actions：Pull Request / `main` push 自動 typecheck、test、build；設定 Cloudflare secrets 後自動套用 D1 migration 並 deploy

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

本專案採 Workers Static Assets。`wrangler.jsonc` 會把 `dist/` 發佈到 Worker，`/api/*` 先進入 Worker；`GET /api/health` 會同時檢查 Worker 與 D1 `save_slots` 表格。

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

企劃書仍以 Browser SPA + IndexedDB 作為 local-first 基礎；Cloudflare D1 `chain-xiii` 已建立，並透過 `wrangler.jsonc` 的 `DB` binding 接到 Worker。`migrations/0001_initial.sql` 目前建立第一個雲端 save slice：`save_slots`。

本機套用 migration：

```bash
npm run db:migrate:local
```

遠端套用 migration（通常由 GitHub Actions 自動執行）：

```bash
npm run db:migrate:remote
```

部署後可用以下 endpoint 驗證 Worker 與 D1：

```bash
curl https://chain-xiii.napoleon-sun.workers.dev/api/health
```

不要把 Cloudflare token、`.dev.vars` 或任何 secret commit 到 Git。
