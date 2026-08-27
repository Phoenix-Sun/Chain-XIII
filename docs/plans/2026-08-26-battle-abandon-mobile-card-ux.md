# Chain XIII：戰鬥離開、手機 UI、十三支選牌 UX 修正計畫

## 目標

以玩家在 390×844 手機畫面上的實際操作為基準，分三個可獨立驗證的階段改善：

1. 中途放棄戰鬥時，使用與 Run 相同的「放棄這趟遠征」操作，正確結束目前狀態並回到營地。
2. 降低手機閱讀與操作負擔：刪除非必要裝飾與重複資訊，放大真正重要的文字與按鈕。
3. 以撲克牌本身為主要操作介面，降低選錯後的修正成本，加入中墩／尾墩互換、最後一墩快速補齊，以及小到大預設排序。

本計畫先維持既有 domain／save／reward 閉環，不重寫整個 RunState，也不把三項改動綁成一個不可回退的大 patch。

## 目前盤點

- `RunState` 目前以 `active`、`won`、`lost` 表示 Run 狀態。
- `GameShell` 持有 `activeRun`，目前系統選單只有返回遊戲，沒有 Run 的放棄操作。
- `RunSessionView` 負責 route、battle、reward、altar、service、settlement 等 phase；戰鬥中途沒有離開 callback。
- `BattleArenaView` 包住 `P0BattleLab`，目前牌局操作仍以三個墩位區塊為主要視覺結構。
- `P0BattleLab` 使用 `CardSortMode = "deal" | "rank" | "suit-rank"`；目前仍保留發牌順序選項，且 `deal` 沒有實際的排序價值。
- `sortCards` 使用 `rankValue`，A 目前以 14 參與排序；需要在設計與測試中明確定義玩家看到的「小到大」規則，避免 UI 排序與戰鬥比較規則混在一起。
- 目前多個遊戲 CSS 使用過小的 `rem`／像素文字與密集的 kicker、英文標籤、重複說明，主要涉及 `game.css`、`battle.css`、`run.css`、`route.css`、`party.css`。
- 既有 `resolveBattleAftermath` 會清理祝福與 Skull 詛咒，但需要一併檢查「下一場戰鬥」型暫時效果在放棄／戰敗時是否正確消耗，避免放棄成為重試或保留效果的漏洞。

## 先定義的狀態契約

### A. 戰鬥中放棄這趟遠征

已確認採用：**放棄本場戰鬥就等同放棄整趟 Run，直接回營地，不另外扣除戰鬥命數。** 這與戰敗不同，因為玩家明確選擇退出整趟遠征；同時也避免「只離開戰鬥、回路線後免費重開」的重試漏洞。

- 清理本場尚未結算的臨時效果與本場資料；不產生戰鬥獎勵。
- 保留既有已寫入 Run 的累積資料，交由同一套 Run 結束／meta merge 流程處理。
- 不套用 normal／elite／boss 的戰敗命數損失。
- 放棄前必須有二次確認，明確說明「這會放棄整趟遠征、無法取得本場獎勵，並回到營地」。
- 戰敗仍維持既有扣命與 route／settlement 規則，不與主動放棄混用。

### B. 放棄整趟 Run

- 可從 Run 的共同操作入口使用，不只限於戰鬥畫面。
- 二次確認後，將 Run 結束為「主動放棄」並回到營地／外層，不進入路線頁。
- 保留既有已寫入 Run 的永久性累積資料（例如已取得並已計入的水晶、基因鏈、遺物、祝福等），不把尚未領取的 battle／altar pending reward 當成已取得。
- 清除 `GameShell` 的 `activeRun`，避免 reload 後恢復已放棄遠征。
- 結算頁若沿用 `status: "lost"`，增加可選的結束原因，例如 `endReason: "abandoned"`，讓文案可區分「戰敗」與「主動放棄」；Save migration 必須對舊存檔補預設值。
- 不扣額外命數；放棄整趟本身不應再造成一次戰鬥傷害。

### C. 返回規則

| 使用者操作 | Run 狀態 | 返回 |
|---|---|---|
| 放棄本場戰鬥 | 任意 battle 狀態 | 營地，清除 active Run |
| 放棄整趟 Run | 任意 phase | 營地，清除 active Run |
| 正常戰敗 | active／lost 依既有規則 | 路線頁／結算頁 |
| 正常完成 Boss | won | 既有結算頁 |

## 實作分階段

### Phase 0：建立狀態與測試契約

**目的：** 在動 UI 前先鎖定離開、結算、保存的語意。

**工作：**

- 追蹤 `GameShell` 的 `settleRun`、active run persistence 與 `RunSessionView` 的 phase 初始化流程。
- 決定 `RunEndReason` 是否加入 `RunState`；若加入，補 `save.ts` migration、normalize 與舊 Save 測試。
- 建立 domain helper，例如 `abandonBattle(run)` 與 `abandonRun(run)`，不要在 React callback 內直接拼狀態物件。
- 將戰敗、放棄戰鬥、正常戰鬥結算共用臨時效果清理規則，特別驗證 `next-battle:focus` 這類一次性效果不會因離開而錯誤保留或重複套用。

**驗收：**

- domain 測試涵蓋 normal／elite／boss、剩餘命數、active／lost、獎勵不誤發、暫時效果清理。
- 舊版 Save 可正常載入，新欄位缺失不會破壞既有 Run。
- reload 後放棄的 Run 不會重新進入 battle、altar 或 reward pending phase。

### Phase 1：接入放棄操作與正確返回

**主要檔案：**

- `src/game/GameShell.tsx`
- `src/game/RunSessionView.tsx`
- `src/features/p0/BattleArenaView.tsx`
- `src/game/RunSettlementView.tsx`
- 對應 `.test.tsx` 與 `src/domain/run*.test.ts`

**工作：**

- 在 Run 共同操作區加入「繼續遊戲」與「放棄這趟遠征」。
- 在戰鬥操作區加入與 Run 共用文案的「放棄這趟遠征」；不要把它與普通返回路線混為一談。
- 建立共用確認面板，使用清楚的危險文案與取消按鈕，所有 action 使用 button／ARIA label，不依賴 hover。
- 讓 `RunSessionView` 在戰鬥中確認放棄後清除 active Run 並回到營地。
- 讓 run abandon 只透過 `onRunSettled`／既有 meta merge 流程完成，確認 activeRun、phase 與 persistence 同步清除。
- 禁止在已有 `won`／`lost`／已結算 reward 的狀態重複執行 abandon action。

**測試：**

- `BattleArenaView.test.tsx`：顯示、取消、確認「放棄這趟遠征」，callback 參數正確。
- `RunSessionView.test.tsx`：battle 中確認放棄後清除 active Run 並回營地。
- `GameShell` 或整合測試：activeRun 被清除、meta 累積資料保留、重新載入不恢復已放棄 Run。
- 既有正常勝利、戰敗、獎勵領取測試必須維持通過。

### Phase 2：手機 UI 資訊減法與字級重整

**主要檔案：**

- `src/game/game.css`
- `src/game/battle.css`
- `src/game/run.css`
- `src/game/route.css`
- `src/game/party.css`
- `src/game/GameShell.tsx` 與各畫面 JSX（只移除重複／非必要內容）

**設計原則：**

- 先刪資訊，再放大留下的資訊；不把現有所有小字單純放大。
- 390×844 是第一驗收尺寸，至少確保 320px 寬不出現橫向捲動。
- 主要標題約 22–26px；區塊標題約 18–20px；主要說明與牌面文字至少 15–17px；次要資訊不低於約 12–13px。
- 主要 CTA 與牌面按鈕至少 48px 高、可操作控件至少 44×44px，間距足以避免拇指誤觸。
- 顏色、像素風與場景感保留，但裝飾不應與 CTA、牌面、命數、目前目標競爭。

**預計刪減／合併：**

- 移除或改為非玩家必要的 English kicker、重複的系統編號、裝飾性小標與同一資訊的第二份文案。
- Run 畫面保留一個清楚的 phase／目前目標區，不再同時堆疊多個小型 ribbon、caption、狀態列。
- 將資源、命數、目前節點等高頻資訊集中在簡短的固定區域；詳細規則放到可點開的說明，而不是常駐小字。
- 路線、隊伍、服務、祭壇卡片每個區塊只保留「名稱、當前效果、主要操作」三層資訊。
- Battle 畫面優先保留：敵方關鍵資訊、玩家手牌、三墩狀態、主要確認按鈕、錯誤／規則提示；次要 debug／flavor 內容不應佔據首屏。

**驗收：**

- 每個主要畫面在 390×844 screenshot 中首屏能讀出目前目標、可操作區與主要 CTA。
- 手機上不需縮放即可辨識牌面 rank／花色、命數、戰鬥結果與錯誤原因。
- UI 測試使用可存取名稱，不依賴已刪除的裝飾文字；`npm run check` 維持通過。
- 若本機瀏覽器權限仍阻擋真實 screenshot，需標記為未完成的視覺 sign-off，不以 DOM 測試代替人工手機驗收。

### Phase 3：以手牌為主的十三支操作模型

**主要檔案：**

- `src/domain/cards.ts`
- `src/domain/cards.test.ts`
- `src/domain/layout.ts`
- `src/domain/layout.test.ts`
- `src/features/p0/P0BattleLab.tsx`
- `src/features/p0/P0BattleLab.test.tsx`
- `src/features/p0/BattleArenaView.tsx`
- `src/features/p0/battle*.css` 或既有 battle style

**操作模型：**

1. **資料穩定性**
   - 所有牌以 `card.id` 作為唯一 identity；排序只改變顯示順序，不重建或遺失已分配的牌。
   - domain 的 `BattleLayout`／`validateLayout` 保持 3／5／5 規則；新增純操作 helper，不把 UI 排序狀態塞入戰鬥結果。

2. **發牌與排序**
   - 發牌後預設使用「點數：小到大」。
   - 移除 `deal` 選項與對應 UI／型別分支。
   - 保留玩家手動切換的「點數」與「花色」兩種顯示排序；花色排序使用目前顯示花色，並用點數作次排序。
   - 明確測試 A 的顯示順序；建議顯示排序採 A、2、3…K，而戰鬥比較仍維持現有 A 的牌力規則，兩者不可共用錯誤的比較語意。

3. **手牌優先**
   - 13 張牌成為畫面主體，使用可橫向捲動或適合窄螢幕的牌列／牌網格；牌面 rank、花色、選取狀態清楚可讀。
   - 三墩改為精簡的狀態列／牌列，不再使用三個大型空框當主要操作區。
   - 以「前墩 0/3、中墩 0/5、尾墩 0/5」的小型目標切換控制指定目前放入的墩；點手牌放入目前墩，點已放置的牌可直接撤回手牌。
   - 滿墩、超過容量、牌型大小關係不合法時，在靠近操作區的位置顯示單一明確錯誤，不依賴底部小字。

4. **快速修正**
   - 「中尾墩互換」直接交換整個 middle／back 陣列，保留牌 identity；交換後重新跑 layout validation，若牌型關係不合法要立刻顯示原因。
   - 每墩提供「收回本墩」或同等低成本撤回操作，避免逐張找牌。
   - 當只剩一個空墩，且手牌數量剛好等於該墩需求時，顯示「補齊最後一墩」按鈕：
     - 已配置 8 張時可快速補 5 張。
     - 已配置 10 張時可快速補 3 張。
   - 快速補齊不是不可逆自動行為；完成後仍可逐張點牌撤回或用整墩收回。
   - 第一版不要求精準拖曳；點擊／批次按鈕優先，避免手機拖曳誤觸與捲動衝突。

**測試：**

- domain：移除 `deal` mode，測試 rank／suit-rank、新 A 排序規則與穩定 tie-break。
- domain：測試中尾墩互換、整墩收回、最後一墩補齊、錯誤容量與 layout validation。
- component：測試點手牌放入、再次點擊撤回、切換目標墩、中尾互換、8／10 張後快速補齊、排序不改變已選牌 identity。
- accessibility：測試每張牌的可存取名稱包含 rank／花色／目前墩位／選取狀態；主要操作可用鍵盤與 screen reader 理解。
- 整合：BattleArena 收到的 layout 格式與既有 `resolveBattle`、主動技能 callback、戰鬥獎勵完全相容。

### Phase 4：整合驗證與玩家視角 QA

- 先跑 targeted domain／component tests，再跑完整 `npm run check`。
- 用 390×844 逐畫面檢查：營地、隊伍、路線、戰鬥、獎勵、祭壇、服務節點、結算。
- 以玩家操作順序走一次：進 Run → 進戰鬥 → 按「放棄這趟遠征」→ 回營地；另走一次進任意 Run phase → 放棄整趟 → 回營地 → reload。
- 13 支至少走四個情境：正常分墩、撤回錯牌、中尾互換、8／10 張快速補齊。
- 檢查沒有橫向溢出、主要文字不用放大即可讀、CTA 不被底部導覽或安全區遮住、React rerender／排序後牌不消失。
- 最後才更新 `docs/PROGRESS.md`、`docs/DEVELOPMENT_LOG.md`、`docs/DECISIONS.md`，並把三個階段分開 commit；未完成的真實手機 screenshot QA 不得在文件中宣稱完成。

## 非目標與風險

- 本輪不重做基因鏈規則、遺物／祭壇規則、地圖生成與戰鬥比較公式。
- 不以新增大量角色主動按鈕解決操作問題。
- 不把放棄 Run 靜默當作普通導覽；它必須經確認並完成 activeRun 清理。
- 不用 CSS 隱藏所有資訊來假裝簡化；被移除的資訊必須確認不是結算、存檔、戰鬥判定所需。
- 不能用 `index` 作為牌的 identity，否則排序、互換或 React rerender 會造成選取錯位。
- 「放棄這趟遠征」在戰鬥內與其他 Run phase 使用同一語意：不扣戰鬥命數，直接回營地並清除 active Run；不得實作成回路線的免費重試。

## 完成條件

- 三種離開／結束狀態都有 domain、save、component／integration 測試。
- 十三支不再提供發牌順序選項，預設小到大並可切換花色。
- 玩家可用點擊快速撤回、中尾墩互換、整墩收回與最後一墩補齊。
- 390×844 主要畫面完成人工檢查；若受瀏覽器權限阻擋，需清楚保留阻塞紀錄。
- `npm run check`、`git diff --check` 通過，且不破壞既有正常 Run、Save、獎勵與戰鬥流程。
