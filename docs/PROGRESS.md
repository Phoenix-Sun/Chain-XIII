# 目前進度

最後更新：2026-08-24

## 工程與部署基礎

| 項目 | 狀態 | 備註 |
|---|---|---|
| React + TypeScript + Vite | ✅ 完成 | Browser SPA 基線可 build |
| D3.js prototype | ✅ 完成 | 目前為開發進度圖 |
| Git repository | ✅ 完成 | `main` 已連到 GitHub |
| GitHub Actions CI | ✅ 完成 | typecheck / test / build |
| Cloudflare Worker | ✅ 完成 | Static Assets + `/api/health` |
| Cloudflare D1 | ✅ 完成 | `chain-xiii` 已建立 |
| D1 `save_slots` migration | ✅ 完成 | local / remote 都已套用 |
| CI 自動 D1 migration | ✅ 完成 | GitHub runner 已成功執行 remote migration |
| CI 自動 Worker deploy | ✅ 完成 | GitHub runner 已成功部署 |

## 遊戲開發階段

| 階段 | 目標 | 狀態 |
|---|---|---|
| P0 | 52 張牌、抽 13、十三支牌型與比較 | ⬜ 尚未開始 |
| P1 | 13 格花色模板與 current/original suit | ⬜ 尚未開始 |
| P2 | 基因鏈掉落、預覽、不可逆融合、3/5/5 裝備 | ⬜ 尚未開始 |
| P3 | 可操作單場戰鬥、角色能力、敵 AI | ⬜ 尚未開始 |
| P4 | Seed 地圖、節點、普通怪、Elite、Boss 路線 | ⬜ 尚未開始 |
| P5 | Boss 規則、神器、探索事件 | ⬜ 尚未開始 |
| P6 | Meta、角色、升星、圖鑑與 MVP 內容 | ⬜ 尚未開始 |
| P7 | Save migration、錯誤紀錄、效能與 UX polish | 🟡 基礎部署已完成 |

## 目前下一步

1. 開始 P0 規則核心，先用純 domain tests 驗證，不先堆 UI。
2. 將 IndexedDB save envelope 與 D1 `save_slots` 的資料格式對齊。
