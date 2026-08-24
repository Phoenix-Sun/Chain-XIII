# 目前進度

最後更新：2026-08-24

## 工程與部署基礎

| 項目 | 狀態 | 備註 |
|---|---|---|
| React + TypeScript + Vite | ✅ 完成 | Browser SPA 基線可 build |
| Git repository | ✅ 完成 | `main` 已連到 GitHub |
| GitHub Actions CI | ✅ 完成 | typecheck / test / build |
| Cloudflare Worker / D1 | ✅ 完成 | Static Assets、`/api/health`、`save_slots` |
| CI 自動 migration / deploy | ✅ 完成 | GitHub runner 已成功執行 |

## 遊戲開發階段

| 階段 | 目標 | 狀態 |
|---|---|---|
| P0 | 52 張牌、抽 13、牌型、元素、三墩比較 | ✅ 核心完成 | 玩家排牌、AI 敵方、逐墩結果已接通 |
| P1 | 13 格花色模板與 current/original suit | ✅ 完成 | `template.ts` 與 13 格預覽 |
| P2 | 基因鏈掉落、預覽、不可逆融合、3/5/5 裝備 | ✅ 第一 slice | `genes.ts` + 花色鍊成工房 |
| P3 | 可操作單場戰鬥、角色能力、敵 AI | 🟡 戰鬥與 Effect 完成第一 slice | 敵 AI、勝負回饋、資料驅動 Effect lifecycle 已完成 |
| P4 | Seed 地圖、節點、普通怪、Elite、Boss 路線 | 🟡 路線骨架完成 | Seed map 與前進 UI 已接；節點內容待接 |
| P5 | Boss 規則、神器、探索事件 | 🟡 catalog + 骰子 foundation | 15 神器／12 事件資料與 deterministic D6 已建立 |
| P6 | Meta、角色、升星、圖鑑與 MVP 內容 | 🟡 資料模型完成 | 9 角色與基本 catalog 已建立，Meta UI 待接 |
| P7 | Save migration、錯誤紀錄、效能與 UX polish | 🟡 local-first foundation | versioned save envelope + IndexedDB adapter 已建立 |

## 已驗證能力

1. 所有抽牌與事件亂數集中到 `SeededRandom`；模板牌分離 `originalSuit` / `currentSuit`。
2. 元素環、牌型優先序、敵 AI 合法分牌、基因鍊成與 3/5/5 裝備均由純函式測試覆蓋。
3. P0 合法提交會呼叫 `resolveBattle`，以固定敵方 seed 產生逐墩牌型／元素／勝負結果。
4. 角色能力已透過共用 `GameEffect` lifecycle 執行，效果只能在指定 phase 使用且同一 Run 不重複觸發。
5. 探索骰支援 deterministic D6、總和門檻與相同點數目標。
6. 內容 validator 會檢查 ID、模板長度、掉落池、Boss 規則與鏈長。
7. 像素風 HUD、領地、Seed 節點路線、對局、鍊成與開發卷宗均已接入 GameShell。

## 下一個自主目標

1. 讓 Run 節點移動觸發戰鬥／事件／神器獎勵，並用 IndexedDB 保存當前 Run。
2. 補 Boss 招牌規則與一次探索骰 UI，讓一個 Seed Run 可以走到結算。
3. 建立最小 Meta Hub：開始 Run、角色選 3 人、結算水晶／圖鑑。
