# Mobile-first 像素遊戲 UI／UX 規劃

最後更新：2026-08-24
階段：Mobile Pixel Shell v1（已完成）

## 目標

Chain XIII 的主介面不再以「像素邊框的網頁卡片」呈現，而是以手機遊戲視窗為核心：玩家先看到持續存在的像素場景，再透過固定 HUD、場景熱點、角色對話框與底部拇指指令列操作。

本階段採 mobile-first；桌機和平板只擴大場景及改成覆蓋式面板，不另做一套操作邏輯。

## 開羅手機遊戲研究摘要

從 Kairosoft 官方 Android／iOS 遊戲列表，以及 Dungeon Village 2、Dream Town Island 的官方商店頁面可觀察到：

1. 像素場景是主體，設施、角色與事件在同一個持續運作的空間中發生。
2. 日期、金錢與重要資源維持可見，避免玩家離開場景才能確認經營狀態。
3. 手機主要操作集中在畫面邊緣與底部；詳細資料以短面板、對話框或暫時視窗呈現。
4. 城鎮類遊戲支援觸控捲動與縮放；按鈕需具有明確狀態、足夠觸控面積與立即回饋。
5. 橫向空間增加時，資訊面板可以浮在場景上；直向手機則需確保場景、資訊與指令列都能在單一視窗內完成操作。

參考資料：

- [Kairosoft 官方 Android 遊戲列表](https://kairopark.jp/android/en/)
- [Kairosoft 官方 iPhone／iPad 遊戲列表](https://kairopark.jp/iphone/en/)
- [Dungeon Village 2 官方 Google Play 頁面](https://play.google.com/store/apps/details?id=net.kairosoft.android.bouken2)
- [Dream Town Island 官方 Google Play 頁面](https://play.google.com/store/apps/details?id=net.kairosoft.android.towns)

以上只用於分析可觀察的互動模式；Chain XIII 的場景、美術、配色與元件均為原創，不複製 Kairosoft 的商標、角色或遊戲素材。

## v1 畫面規格

### 手機直向

- 使用 `100dvh` 全高遊戲框，處理瀏覽器動態工具列。
- 上方固定資源 HUD；小尺寸只顯示必要數值，避免擠壓主場景。
- 中央以 3:2 原創像素城鎮圖作為可點擊場景，不再以 CSS 方塊拼地圖。
- 設施直接以 46px 熱點操作；選取後顯示名稱、設施資訊與至少 52px 高的主要按鈕。
- 角色對話框提供即時操作回饋。
- 底部六格拇指指令列固定顯示，並支援 safe-area inset。
- 城鎮、遠征、對局、鍊成與記錄拆成獨立畫面，避免長頁面上下堆疊。

### 平板／桌機

- `700px` 以上採放大的遊戲視窗。
- 設施資訊與角色對話改為覆蓋在場景上，不改變功能層級。
- HUD 顯示完整日期、資源名稱與品牌副標。
- 畫面最大寬度 1080px，避免像素場景在超寬螢幕失去閱讀密度。

### 極小螢幕與橫向

- `370px` 以下縮減品牌、資源與設施面板，但維持主要按鈕可點擊。
- 高度低於 560px 的橫向裝置縮短 HUD 與底部指令列。
- 支援 `prefers-reduced-motion`，停用熱點與對話提示動畫。

## 本階段完成內容

- 原創 `chain-xiii-town.webp` 像素城鎮場景。
- 原創 `tactician-portrait.webp` 角色圖像。
- mobile-first `GameShell`、固定資源 HUD、速度控制、任務提示與系統暫停窗。
- 城鎮設施熱點、選取狀態、資訊面板、角色對話與操作回饋。
- 遠征由城鎮長頁面分離為獨立底部指令。
- PNG 已轉成 lossless WebP；素材由約 4.31 MB 降至約 2.83 MB。
- 新增手機導覽、系統選單與城鎮設施互動測試。

## 驗證狀態

- TypeScript typecheck：通過。
- Vitest：22 個 test files、48 個 tests 通過。
- Vite production build：通過（lossless WebP 素材已納入輸出）。
- `git diff --check`：通過。
- 實際瀏覽器手機尺寸截圖：本輪因 Windows sandbox refresh 錯誤無法啟動瀏覽器控制，列為下一階段第一個 QA 任務；不可宣稱已完成真機視覺驗收。

## 下一階段

1. 在 360×800、390×844、430×932、768×1024 與橫向 844×390 做截圖比對。
2. 補地圖拖曳、雙指縮放與鏡頭回正；目前 v1 以完整比例地圖及大型熱點為主。
3. 讓設施主要按鈕直接導向對局、鍊成與記錄，而不只顯示提示。
4. 將戰鬥與鍊成內頁改造成相同的手機遊戲視窗密度，減少剩餘的網頁卡片感。
5. 視真機清晰度再評估素材尺寸、WebP 品質與首屏載入策略。