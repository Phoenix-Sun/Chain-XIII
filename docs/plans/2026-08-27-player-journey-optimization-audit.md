# Chain XIII 玩家旅程優化 Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 以第一次遊玩的手機玩家為中心，降低從營地到第一場戰鬥的理解成本，修復中斷／存檔狀態風險，並讓每個畫面只突出一個當前決策。

**Architecture:** 保留 React + TypeScript、既有 domain／view／service／RunState 分層，不重寫戰鬥公式或地圖生成。先把 Run 的可恢復狀態契約補完整，再依「第一分鐘 → 路線 → 戰鬥 → 獎勵」的玩家順序調整資訊層級。所有玩家可見的操作都維持語意 HTML、穩定 accessible name 與可逆回復路徑。

**Tech Stack:** React, TypeScript, Vite, Vitest, IndexedDB, GitHub Actions, Cloudflare Workers Static Assets / D1.

**Audit status (2026-08-27):** 第一輪玩家旅程、domain／persistence 與手機可及性審查已完成；本階段已修正元素覆寫錯置、modal focus、手機控制項、開局水晶刷取、Forge stale state、戰鬥技能／探索／獎勵的 pending state、保存錯誤回饋、祭壇 caller 驗證、settlement 冪等、結束原因、重複基因統計、起始怪物圖鑑誤解鎖，以及組隊／路線／結算資訊不足。Cloudflare 實站手機驗收與戰鬥首屏詳情折疊仍待後續 phase。

---

## Audit scope and evidence

### 玩家模擬路徑

```text
開啟遊戲
→ 營地選設施
→ 組成遠征隊
→ 選難度並開始
→ 選下一個路線節點
→ 進入戰鬥／事件／祭壇／服務
→ 領取獎勵
→ 繼續路線或結算
→ 回到營地開始下一趟
```

### 已確認的高風險問題

#### P0-A：第一個有效決策被非必要系統推到後面

**證據：** `src/game/PartyView.tsx:58-96`

隊伍頁的 DOM 順序是：出戰隊列 → 難度 → 永久技能樹 → 說明 → 角色名冊 → 開始遠征。新玩家只有一名預設角色時，必須先看到一整個永久技能樹（目前按鈕多半不可用）與大量說明，才看到真正要點選的角色名冊與開始按鈕。

**玩家感受：** 「我現在到底要先升級、選難度，還是選人？」第一趟遊戲的主線被 Meta 系統打斷。

**修正方向：** 角色名冊與開始遠征成為第一優先；難度保留在同一頁但降低干擾；永久技能樹改為可展開的次要區塊，沒有可用水晶時預設收合。

#### P0-B：戰鬥首屏資訊競爭，主要牌局被推到後面

**證據：** `src/features/p0/BattleArenaView.tsx:107-128`、`src/game/battle.css:107-129`

戰鬥在牌桌前常駐顯示敵方資訊、目標、候選牌組、章節強度、Boss 特性、祝福、Skull 詛咒、遺物、角色技能與額外提示。這些規則可能都重要，但沒有依「現在要做什麼」分層，導致玩家必須先讀多個面板才能看到手牌。

**玩家感受：** 進入戰鬥後看不到第一個操作目標，容易把十三支誤解成需要先讀規則的複雜表單。

**修正方向：** 首屏只固定保留敵人、三墩規格、手牌與主要確認；候選牌組、Boss 規則、遺物詳情、技能解釋收進可展開的規則／詳情區。放棄操作仍需在不影響主 CTA 的位置可達。

#### P0-C：十三支目前仍是「批次按鈕集合」，沒有清楚的目前目標

**證據：** `src/features/p0/P0BattleLab.tsx:172-194`

雖然手牌已移到前面，但放入頭／中／尾、退回、補齊、中尾互換、清除選取與每墩收回同時存在於操作列；未選牌時仍會顯示多個不適用的控制。玩家仍需思考「我現在要先選牌還是先指定墩位」。

**玩家感受：** 選錯後雖然能修正，但修正路徑不夠直接；手機上操作列容易變成第二個資訊牆。

**修正方向：** 使用清楚的目前目標（頭／中／尾）與選牌狀態：

- 未選牌時只顯示目標切換與簡短提示。
- 選 3 張時只突出「放入頭墩」。
- 選 5 張時只突出「放入中墩／尾墩」。
- 已選墩位牌時只突出「退回手牌」。
- 中尾互換、整墩收回與快速補齊放到「快速修正」區，不與主要放入操作平級競爭。

### 已確認的狀態／整合問題

#### P1-A：探索骰結果是 local-only，reload 會丟失玩家當前決策畫面

**證據：** `src/game/ExplorationView.tsx:8-19`、`src/game/RunSessionView.tsx:145-153`

`ExplorationView` 的 `result` 與 `attempt` 只存在 component state；投擲後尚未按「查看事件獎勵」時 reload，Run 仍停在同一事件，但畫面回到未投擲狀態。雖然 deterministic seed 讓結果通常可重算，玩家仍會失去已看到的結果，且狀態契約沒有明確表示「已投擲待確認」。

**修正方向：** 在 `RunState` 加入可序列化的 `explorationState`（nodeId、attempt、result／status），每次投擲與重擲後先由 `onRunUpdated` 寫入；完成事件獎勵時原子清除。補 `save.ts` normalize／migration 與 reload 測試。

#### P1-B：IndexedDB 寫入失敗被靜默吞掉

**證據：** `src/game/GameShell.tsx:56-59`

`saveToIndexedDb(...).catch(() => undefined)` 會忽略寫入失敗；目前只有讀取失敗會設定 `persistenceFailed`。玩家可能以為已保存，實際上 reload 後遺失最近進度。

**修正方向：** 分離讀取／寫入錯誤狀態，寫入失敗時顯示明確的「進度未保存」提示，保留 retry／下一次 state change 重試策略；測試寫入失敗時不會假裝保存成功。

#### P1-C：Run 結束原因仍被壓成 `lost`

**證據：** `src/domain/run.ts:10,127-137`、`src/domain/save.ts:137`

主動放棄與命數歸零都使用 `status: "lost"`。目前 GameShell 會立即清除 active Run，因此不一定造成玩家畫面錯誤，但 domain 無法區分主動放棄與正常戰敗，日後結算文案、統計或獎勵規則容易誤用。

**修正方向：** 增加可選的 `endReason: "defeat" | "abandoned" | "victory"`，舊 Save 缺少時依既有 status 補值；`abandonRun` 設為 `abandoned`，`failCurrentNode`／Boss 完成設為對應原因。不可改變目前放棄後回營地與 Meta merge 語意。

### 規格與程式漂移

#### P1-D：戰鬥 UX 文件仍描述已移除的排序模式與舊版畫面順序

**證據：** `docs/BATTLE_UI_UX.md:15-29,76-92` 與目前 `src/domain/cards.ts`、`src/features/p0/P0BattleLab.tsx` 不一致。

文件仍寫「原始牌序、點數、花色／點數」三種排序，且寫三墩區先於手牌；目前程式已改為點數／花色兩種排序與手牌優先。

**修正方向：** 在實作前先同步文件與測試契約，避免下一輪維護把舊 UX 恢復回來。

#### P0-G：放棄遠征可回收永久技能提供的開局水晶

**證據：** `src/domain/skillTree.ts:20,32`、`src/domain/run.ts:59-86`、`src/domain/save.ts:85-94`

`route-network` 每趟遠征提供 5 水晶，而 `earnedCrystals` 同時被用作本趟可花餘額與結算收入。立即放棄時，原本未消耗的開局補給會被 `mergeRunIntoMeta()` 當成永久收入，形成可重複刷水晶的經濟漏洞。

**本次已修正：**

- `RunState` 新增 `startingCrystals`，保留開局補給的來源界線。
- 新 Run 仍可正常使用 5 水晶。
- 結算只合併超過初始補給的部分；立即放棄或只消耗開局補給不增加 Meta 水晶。
- 舊 Save 缺欄位時，依永久技能回推 `startingCrystals`。
- 新增立即放棄、消耗部分補給後放棄、取得獎勵後結算的 regression tests。

#### P1-E：元素墩覆寫未跟隨牌組生命週期

**證據：** `src/features/p0/P0BattleLab.tsx:92-127`

潮汐流轉建立的 `laneElementOverrides` 原本會在墩位收回、部分牌退回、最後一墩補齊或中尾墩交換後留在舊的 lane key。這會讓下一批不同牌組繼承舊元素，或讓元素效果套到交換後的另一墩，直接影響 `resolveBattle` 的結果。

**本次已修正：**

- 收回整墩、選取牌退回手牌、最後一墩補齊時清除該 lane 的覆寫。
- 中尾墩交換時同步交換 `middle`／`back` 覆寫。
- 新增 `P0BattleLab` 回歸測試，驗證清除與交換後傳出的 override。

#### P1-F：確認型 modal 沒有完整鍵盤焦點生命週期

**證據：** `src/game/GameShell.tsx:42-80`、`src/features/p0/BattleArenaView.tsx:63-101`

系統選單與戰鬥放棄確認雖然宣告 `aria-modal`，但原本沒有把焦點移入、限制 Tab 範圍、Escape 關閉，也沒有在關閉後將焦點還給觸發按鈕。

**本次已修正：** 兩個 modal 都加入焦點移入、Tab 循環、Escape 關閉與關閉後回焦；改用 `aria-labelledby` 對應可見標題，避免可見文字與 accessible name 漂移。戰鬥期間也移除系統選單內重複的放棄入口。

#### P2：手機控制項與 CSS breakpoint 的可達性問題

**審查證據：** `src/styles.css`、`src/game/battle.css`、`src/game/run.css`、`src/game/party.css`

審查確認 Tide Flow 按鈕、排序、墩位收回、技能、升星與技能解鎖按鈕部分低於舒適觸控尺寸；`max-width: 390px` 的祭壇規則與路線／Run CSS import order 也可能被後續規則覆寫。

**本次已修正：** 補上 390／600／480px 後置規則，將主要可操作控制提高到至少 44～46px，並讓路線預覽文字與祭壇骰子在窄寬度套用預期尺寸。真實 Cloudflare 站台上的像素與溢出狀況仍需人工 sign-off。

### 審查補充：尚未實作的狀態與經濟風險

以下是本階段已完成的 RunState／persistence／經濟修正；保留作為回歸契約：

- **Forge／戰鬥／探索／獎勵保存：** 已改為完整 transition snapshot，並由 Save normalize 只接受合法節點與可重建資料。
- **IndexedDB failure：** 已分離 unsupported／load／save 狀態，顯示進度未保存並提供重試；未取得 acknowledgement 前不宣稱成功。
- **祭壇／settlement：** 已由 persisted altar state 重算 caller 數值；Meta 以 `settledRunSeeds` 防重複 merge。
- **圖鑑／結算回饋：** 起始節點不再視為實際怪物遭遇；Boss 勝利才發放出戰角色 imprint；重複基因鏈只計一次。
- **組隊／路線資訊：** 已補角色主動技能摘要、戰鬥危險類型、可能基因鏈數量與水晶收益。
- **平手語意：** 既有規則為非勝利結果進入戰敗處理，現已顯示「三墩平手（視為戰敗）」及對應本場損失，不再只顯示中性的平手。
- **P1 首趟遠征核心戰鬥教學：** 起始節點仍是已完成的營地 bookkeeping，但現在每張新地圖都保證第 1 章第 2 層有一個普通戰鬥，且起始節點只連向該戰鬥；路線畫面明確顯示「先從第一場戰鬥開始」及三墩目標。這是固定入口與導引契約，不改變戰鬥公式或後續地圖生成。
- **P0 戰鬥首屏與目前目標墩：** 次要敵牌／章節／遺物規則已收進可點擊的「查看戰鬥詳情」；手牌配置會依選牌數量與空墩狀態以 `aria-current="step"` 和金色邊框標示下一個目標墩，仍保留合法的批次放入、撤回與確認操作。
以下仍未完成：完整 390×844 Cloudflare 實站驗收，以及更完整的 end-to-end reload 人工 click-through。

### 尚需 Cloudflare 390×844 驗證的假設

以下目前不能只靠 DOM／Vitest 判定，必須 push 後用 Cloudflare 站台查看：

- 營地圖像與設施 hotspot 在 390×844 是否容易辨認與點擊。
- 路線 520px 最小地圖高度是否把第一個可達節點推離首屏。
- Battle 詳情折疊後，手牌、確認 CTA、放棄 CTA 是否同時可達且沒有被底部導覽遮住。
- 4 欄手牌在 320／390／430 寬度是否仍能看清 rank、花色與選取編號。
- 祭壇五顆骰與服務按鈕是否符合拇指操作與文字可讀性。
- 低速行動網路下 2.2 MB 營地素材是否造成首屏等待。

這些項目在未完成 Cloudflare 實際驗收前，必須標記為「未 sign-off」。

---

## 優化優先順序

1. **P0：經濟與結算邊界** — 已修正開局水晶可刷回 Meta 的漏洞，後續仍需用完整 settlement contract 保護。
2. **P0：第一分鐘可玩性** — 隊伍頁只突出「選角色 → 選難度 → 開始遠征」，並確保第一趟核心戰鬥目標清楚。
3. **P0：戰鬥首屏與十三支操作** — 玩家進入戰鬥後立即知道要看什麼、點什麼、如何撤回；平手結果要先完成規則決策。
4. **P1：中斷與存檔可靠性** — 探索投擲、IndexedDB 寫入失敗、一次性技能、獎勵選擇與 Run 結束原因。
5. **P1：組隊／路線／結算決策品質** — 主動技能摘要、戰鬥風險收益、imprint 獎勵與結果文案。
6. **P1：規格同步與自動化旅程測試** — 防止 UI 契約與程式再次漂移。
7. **P2：內容與性能 polish** — 新手引導、素材壓縮／首屏載入、次要頁面折疊與視覺細修。

不先擴充角色、遺物或地圖內容；如果玩家尚未能順利完成第一個有效決策，增加內容只會放大理解負擔。

---

## Implementation tasks

### Phase 1：固定第一分鐘的玩家決策

#### Task 1：建立隊伍頁玩家旅程測試

**Files:**
- Modify: `src/game/PartyView.test.tsx`
- Modify: `src/App.test.tsx`

**Steps:**

1. 增加測試：新帳號能在不依賴永久技能樹操作的情況下，看到角色名冊、選擇難度並開始遠征。
2. 增加測試：永久技能樹的收合／展開不改變角色選擇與開始遠征 callback。
3. 執行 `npm run test -- --run src/game/PartyView.test.tsx src/App.test.tsx`。

#### Task 2：重排 PartyView 的資訊層級

**Files:**
- Modify: `src/game/PartyView.tsx`
- Modify: `src/game/party.css`

**Steps:**

1. 將角色名冊與開始遠征 CTA 提到主要決策區。
2. 保留難度選擇，但把完整説明降為可讀的短句。
3. 將永久技能樹改成次要可展開區；沒有可購買技能時預設收合。
4. 保持 1～3 名角色規則、升星與技能解鎖 callback 不變。
5. 重新執行 Task 1 的測試與 typecheck。

### Phase 2：建立可恢復的 Run 狀態契約

#### Task 3：為探索投擲建立 RunState pending state

**Files:**
- Modify: `src/domain/run.ts`
- Modify: `src/domain/save.ts`
- Modify: `src/domain/exploration.ts`
- Modify: `src/game/ExplorationView.tsx`
- Modify: `src/game/RunSessionView.tsx`
- Test: `src/domain/run.test.ts`, `src/domain/save.test.ts`, `src/game/ExplorationView.test.tsx`, `src/game/RunSessionView.test.tsx`

**Steps:**

1. 先寫 failing tests：投擲後 Run 保存 pending exploration；reload 可恢復結果；完成事件後清除 pending state。
2. 在 `RunState` 加入 optional、可 migration 的 `explorationState`，包含 nodeId、attempt、result 與狀態。
3. `ExplorationView` 接收 initial pending state，投擲／重擲先回寫，再讓玩家查看獎勵。
4. `RunSessionView` 只在事件完成與 reward claim 的正確節點清除它。
5. 在 `save.ts` 補舊 Save 缺欄位的預設值與不合法資料 normalize。
6. 執行受影響測試與完整 typecheck。

#### Task 4：讓寫入失敗可見且可恢復

**Files:**
- Modify: `src/game/GameShell.tsx`
- Modify: `src/services/persistence/indexedDb.ts`（若需補可測試錯誤注入）
- Test: `src/App.test.tsx`, `src/services/persistence/indexedDb.test.ts`

**Steps:**

1. 先補寫入失敗測試與 UI 狀態測試。
2. 將讀取錯誤與寫入錯誤拆成不同狀態。
3. 寫入失敗時顯示「進度未保存」，不顯示會讓玩家以為安全的成功文案。
4. 保留 queue，讓後續 state change 可再次保存；必要時提供一次明確 retry。
5. 測試成功寫入、失敗寫入與重新恢復。

#### Task 5：補 Run 結束原因，不改既有獎勵語意

**Files:**
- Modify: `src/domain/run.ts`
- Modify: `src/domain/save.ts`
- Modify: `src/game/RunSettlementView.tsx`（只在需要顯示時）
- Test: `src/domain/run.test.ts`, `src/domain/save.test.ts`, `src/game/RunSessionView.test.tsx`

**Steps:**

1. 先測試舊 Save 缺 `endReason` 時仍能正常 migration。
2. 加入 `endReason` 並讓 `abandonRun`、正常戰敗、Boss 勝利各自寫入正確值。
3. 確認放棄仍直接回營地、清除 active Run、保留已寫入 Meta 資料。
4. 確認正常戰敗仍走原本 route／settlement 規則。

### Phase 3：重做戰鬥資訊階層

#### Task 6：先定義 Battle 首屏必留資訊

**Files:**
- Modify: `docs/BATTLE_UI_UX.md`
- Modify: `docs/DECISIONS.md`（若現有決策紀錄需要同步）
- Test: `src/features/p0/BattleArenaView.test.tsx`

**Steps:**

1. 文件固定首屏順序：敵方 → 本回合目標 → 手牌／分墩 → 確認。
2. 文件固定次要資訊：候選牌組、Boss 規則、遺物細節、技能說明可折疊。
3. 文件固定「放棄這趟遠征」的共同文案與確認語意。
4. 移除舊排序／舊畫面順序文字，保留目前兩種排序契約。

#### Task 7：把次要規則收進可理解的詳情區

**Files:**
- Modify: `src/features/p0/BattleArenaView.tsx`
- Modify: `src/game/battle.css`
- Test: `src/features/p0/BattleArenaView.test.tsx`

**Steps:**

1. 先測試首屏仍有敵方、目標、手牌與主要 CTA 的 accessible region。
2. 將候選牌組、章節強度、Boss 特性、遺物詳細效果與角色技能分組到可點擊詳情區。
3. 詳情區使用 button／`aria-expanded`，不用 hover；既有技能效果與 callback 不變。
4. 放棄按鈕維持可達且二次確認仍為 alertdialog。
5. 用 Cloudflare 站台的 390×844 實際檢查首屏與底部 CTA。

### Phase 4：把十三支操作改成單一目前目標

#### Task 8：建立 target-lane domain／component contract

**Files:**
- Modify: `src/domain/layout.ts`
- Modify: `src/features/p0/P0BattleLab.tsx`
- Test: `src/domain/layout.test.ts`, `src/features/p0/P0BattleLab.test.tsx`

**Steps:**

1. 先測試頭／中／尾目前目標、合法選牌數、快速修正動作與 stable card ID。
2. 未選牌時顯示目前目標與短提示；依選取數量只突出合法主要 action。
3. 把中尾互換、整墩收回、快速補齊移到次要「快速修正」區。
4. 保留逐張撤回、完整 layout validation 與 `onLayoutConfirmed` 的既有資料格式。
5. 測試排序、rerender、批量補齊後逐張撤回不會遺失牌。

#### Task 9：完成手機牌桌視覺驗收

**Files:**
- Modify: `src/styles.css`
- Modify: `src/game/battle.css`
- Modify: `src/game/run.css`（只處理 Run session 間距／safe area）

**Steps:**

1. 以 Cloudflare 站台在 390×844 檢查 13 張牌的 rank／花色／選取編號。
2. 檢查 320、390、430 寬度沒有橫向溢出。
3. 檢查確認、放棄、撤回、互換與補齊按鈕達到拇指尺寸且不被底部導覽遮住。
4. 若發現問題，以最小 CSS 修正處理，不改 domain 行為。
5. 保存 screenshot／測試紀錄；未能實際查看的尺寸不得標記完成。

### Phase 5：新手引導、性能與文件收尾

#### Task 10：補第一趟必要的新手提示

**Files:**
- Modify: `src/game/GameShell.tsx` 或對應畫面 component
- Modify: `src/game/game.css`
- Test: `src/App.test.tsx`

**Steps:**

1. 只在首次流程顯示短提示：13 張牌、3／5／5、基因鏈改花色、戰敗／放棄的差異。
2. 不新增長篇教學頁，不阻塞既有玩家的每次 Run。
3. 提供關閉／已看過狀態，並確認不污染 RunState 的戰鬥判定。

#### Task 11：檢查營地素材與首屏載入

**Files:**
- Inspect/Modify: `src/assets/pixel/chain-xiii-town.webp`
- Modify: `src/game/TownView.tsx`（如需 loading／尺寸提示）
- Test: `src/game/TownView.test.tsx`

**Steps:**

1. 以 Cloudflare 站台檢查低速行動網路下的首屏等待與圖片顯示。
2. 若品質允許，建立較小的手機素材版本或合適的 responsive loading。
3. 保持圖片替代文字與 hotspot 可用性。

#### Task 12：同步進度與驗收文件

**Files:**
- Modify: `docs/PROGRESS.md`
- Modify: `docs/DEVELOPMENT_LOG.md`
- Modify: `docs/DECISIONS.md`
- Modify: `docs/BATTLE_UI_UX.md`

**Steps:**

1. 只記錄已實際完成的 scope。
2. 明確分開 Vitest／typecheck／build 與 Cloudflare 390×844 人工驗收。
3. 更新本 audit 計畫的完成狀態與剩餘風險。
4. 不寫入 API token、密碼、OAuth 憑證或其他 secrets；如需提及，一律使用 `[REDACTED]`。

---

## Verification matrix

### Automated

```bash
npm run typecheck
npm run test
npm run build
git diff --check

```

本階段修正後實際結果：`npm run check` 通過，37 個 test files、181 個 tests；typecheck 與 production build 皆通過。`git diff --check` 亦通過；尚未包含 Cloudflare deploy 或 390×844 人工 sign-off。

最低必要測試：

- `src/App.test.tsx`
- `src/game/PartyView.test.tsx`
- `src/game/ExplorationView.test.tsx`
- `src/game/RunSessionView.test.tsx`
- `src/features/p0/BattleArenaView.test.tsx`
- `src/features/p0/P0BattleLab.test.tsx`（目前 10 tests，包含元素覆寫清除／交換）
- `src/domain/run.test.ts`
- `src/domain/save.test.ts`
- `src/domain/layout.test.ts`
- `src/services/persistence/indexedDb.test.ts`

### Cloudflare site acceptance

每個 coherent phase 完成後才 push，透過 GitHub Actions 部署到 Cloudflare，再從 Cloudflare 站台檢查：

1. 新帳號：營地 → 隊伍 → 難度 → 開始遠征。
2. 路線：第一個可達節點一眼可辨認，點擊後進入正確 phase。
3. 戰鬥：首屏看得到目前目標與手牌；排序、選牌、放入、撤回、互換、補齊、確認都可完成。
4. 戰鬥中「放棄這趟遠征」→ 二次確認 → 營地；reload 不恢復該 Run。
5. 事件投擲後 reload：結果仍在；完成獎勵後 pending state 清除。
6. 寫入失敗：畫面明確告知未保存，不假裝成功。
7. 祭壇、服務、獎勵、結算：主要 CTA 清楚，文字不用縮放即可閱讀。
8. 390×844、430×932、320×800；必要時補 844×390 橫向檢查。

### Stop conditions

- 任何 phase 破壞正常戰敗、Boss 勝利、獎勵領取、Meta merge 或 Save migration，立即停止後續 UI polish，先修 root cause。
- Cloudflare 站台未更新或 GitHub Actions 未成功，不把本機 build 當成部署完成。
- 無法取得真實手機尺寸畫面時，標記為未 sign-off，不以 DOM 測試冒充視覺驗收。
- 不啟動本地開發伺服器；本機只執行 automated checks。

## Out of scope

- 不重寫戰鬥比較公式、敵 AI、地圖生成或遺物／祭壇經濟。
- 不新增大量角色主動技能來掩蓋資訊架構問題。
- 不把所有系統全部塞進首屏。
- 不用 CSS 隱藏真正需要理解的狀態。
- 不在沒有玩家旅程證據前擴充大量內容。
