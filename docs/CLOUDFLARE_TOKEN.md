# Cloudflare API Token 設定指南

這份文件只記錄取得與放置 token 的流程，不記錄 token 本身。

## 1. 在 Cloudflare 建立 token

1. 登入 Cloudflare Dashboard。
2. 開啟 [Account API Tokens](https://dash.cloudflare.com/?to=/:account/api-tokens)。
3. 選擇 **Create Token**。
4. 建議選 **Custom token**，建立名稱，例如：`chain-xiii-github-actions`。
5. 權限至少包含：
   - Cloudflare Workers deploy 所需的 Workers 編輯權限（可從 **Edit Cloudflare Workers** template 開始）。
   - **Account → D1 → Edit**，因為 CI 會執行 remote migration。
6. Resource scope 只選 Chain XIII 使用的 Cloudflare account，不要開放到其他 account；目前專案不需要額外的 zone 權限。
7. 建立後只在 Cloudflare 畫面複製一次 token，存到自己的密碼管理器。

Cloudflare 官方文件：

- [GitHub Actions authentication](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [D1 API token permissions](https://developers.cloudflare.com/d1/tutorials/import-to-d1-with-rest-api#1-create-a-d1-api-token)

## 2. 把 token 放進 GitHub Secrets

不要把 token 貼到聊天、README、程式碼或 `.env`。在 GitHub repository 開啟：

```text
Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

新增：

```text
Name: CLOUDFLARE_API_TOKEN
Value: 剛剛建立的 token
```

`CLOUDFLARE_ACCOUNT_ID` 已經設定在 repository secrets；不需要把 token 寫進任何專案檔案。

也可以在自己的本機終端機使用 GitHub CLI 互動輸入：

```bash
gh secret set CLOUDFLARE_API_TOKEN \
  --repo Phoenix-Sun/Chain-XIII
```

這個指令會要求你輸入 secret value；不要把 value 放在 command line 參數中。

## 3. 驗證自動部署

設定完成後，在本機 push 一個 commit，或到 GitHub Actions 重新執行 `CI` workflow。成功的流程應該依序看到：

```text
Typecheck, test, build
Apply D1 migrations
Build and deploy Worker
```

若 token 被撤銷或權限不足，先在 GitHub Actions log 看失敗步驟；不要把 token 貼到 issue 或 log。
