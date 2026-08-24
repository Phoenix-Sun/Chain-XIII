# 專案協作文件

這個資料夾只放可安全提交到 GitHub 的專案協作資料，讓不同電腦可以同步掌握目前狀態。

## 文件索引

- [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md)：按日期記錄已完成工作與驗證結果
- [PROGRESS.md](./PROGRESS.md)：目前階段、功能進度與下一步
- [CHECKLIST.md](./CHECKLIST.md)：跨電腦開發、Git、CI/CD、Cloudflare 與 D1 檢核表
- [DECISIONS.md](./DECISIONS.md)：架構與工具決策，避免不同電腦各自走不同方向
- [CLOUDFLARE_TOKEN.md](./CLOUDFLARE_TOKEN.md)：安全取得與設定 GitHub Actions token 的流程

## 使用規則

1. 每次完成一個可驗證的工作後，更新 `DEVELOPMENT_LOG.md` 與必要的 checklist。
2. 新增功能前先更新 `PROGRESS.md` 的對應項目，完成後再勾選。
3. 架構改動或部署策略改動記錄到 `DECISIONS.md`。
4. 不在這裡放密碼、API Token、`.dev.vars`、`.env` 或其他機密。
5. 所有文件都應能在另一台電腦 clone repository 後直接閱讀，不依賴本機私有路徑。
