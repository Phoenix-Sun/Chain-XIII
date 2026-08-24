# Chain XIII 協作檢核表

## 每台新電腦第一次設定

- [ ] 安裝 Node.js 22+
- [ ] clone `https://github.com/Phoenix-Sun/Chain-XIII.git`
- [ ] 執行 `npm ci`
- [ ] 執行 `npm run check`
- [ ] 需要本機 Cloudflare 操作時執行 `npx wrangler login`
- [ ] 用 `npx wrangler whoami` 確認登入正確 Cloudflare account

## 每次開發前

- [ ] `git pull --rebase origin main`
- [ ] 閱讀 `docs/PROGRESS.md`
- [ ] 閱讀 `docs/DEVELOPMENT_LOG.md` 最近一筆
- [ ] 確認沒有未預期的 working tree 變更

## 每次提交前

- [ ] 不包含 token、密碼、`.env`、`.dev.vars` 或私有憑證
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `git diff --check`
- [ ] 更新 `docs/PROGRESS.md`（若進度有變）
- [ ] 更新 `docs/DEVELOPMENT_LOG.md`（若完成可驗證工作）
- [ ] 使用清楚的 commit message

## GitHub CI/CD

- [x] `.github/workflows/ci.yml` 存在
- [x] Pull Request 會執行 typecheck / test / build
- [x] `main` push 會觸發 deployment job
- [x] `CLOUDFLARE_ACCOUNT_ID` 已設定
- [ ] `CLOUDFLARE_API_TOKEN` 已設定
- [ ] GitHub runner 成功套用 D1 remote migrations
- [ ] GitHub runner 成功部署 Worker
- [ ] GitHub Actions log 沒有 secret 輸出

## Cloudflare / D1

- [x] `wrangler.jsonc` 有 `DB` binding
- [x] `wrangler.jsonc` 有 `migrations_dir`
- [x] `migrations/0001_initial.sql` 已提交
- [x] remote D1 有 `save_slots` 表
- [x] `/api/health` 回報 D1 connected
- [ ] 新增 migration 後先 local apply
- [ ] 確認 migration 可重複執行且不破壞既有資料
- [ ] 部署後執行 production health smoke test

## 絕對不要提交

```text
.env
.env.*
.dev.vars
.dev.vars.*
CLOUDFLARE_API_TOKEN
任何密碼、私鑰、session、access token
```
