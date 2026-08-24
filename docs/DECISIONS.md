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
