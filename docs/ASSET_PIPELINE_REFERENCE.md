# Agent Sprite Forge 資產流程參考

## 目的

本文件記錄 Chain XIII 參考外部專案 [0x0funky/agent-sprite-forge](https://github.com/0x0funky/agent-sprite-forge/blob/main/README.zh-TW.md) 的資產製作與交接方法。

參考重點是可重現的 asset workflow，不是直接複製外部 repository、素材、角色或場景。Chain XIII 仍維持 React + TypeScript + Vite + Cloudflare Worker 的 Web 遊戲架構。

## 參考來源

- Repository：`0x0funky/agent-sprite-forge`
- 參考文件：[README.zh-TW.md](https://github.com/0x0funky/agent-sprite-forge/blob/main/README.zh-TW.md)
- License：外部 repository README 標示 MIT；若未來實際拷貝或修改其程式碼，仍需逐檔確認授權與 attribution 要求。
- 本專案目前沒有拷貝該 repository 的程式碼或圖片。

## Chain XIII 採用的原則

### 1. 先定義 asset contract

在生成或繪製素材前，先記錄：

- 資產用途：營地、角色、怪物、Boss、卡牌、技能、遺物、FX 或 UI icon
- 視角與風格：手機優先、可愛清楚、像素化、KAIRO／Kairosoft 氛圍
- 尺寸與比例：遊戲實際顯示尺寸、縮放方式與 safe-area 影響
- frame 數與 sheet layout：例如 `1x4`、`2x2`、`3x3`
- 命名、版本、來源與授權資訊
- 是否需要透明背景、碰撞、排序或互動區域

不要先產生一張無法拆分、無法驗證、也無法說明用途的裝飾圖。

### 2. 可重用 bundle 優先於單張圖片

未來 Chain XIII 的角色／怪物資產可依用途拆成：

- identity / portrait
- idle 或待機小動畫
- attack / skill
- projectile / impact / hit
- reward 或掉落 icon
- metadata：frame size、frame count、anchor、縮放與來源

同一個角色資產應能服務隊伍畫面、戰鬥、技能回饋與圖鑑，而不是每個畫面各放一張互不相容的圖。

### 3. 以 deterministic post-processing 做整理

若未來接入圖片生成或外部素材，整理流程應保持可重跑：

```text
raw asset
→ 去背／despill
→ 尺寸與像素對齊
→ frame extraction
→ transparent PNG / WebP
→ metadata
→ visual QA
→ 接入遊戲
```

產物應盡量包含：

- 清理後主檔
- frame 或 strip
- 可選的 preview GIF
- `pipeline-meta.json` 或等價 metadata
- 使用的 prompt／來源摘要（不得包含 secrets）

目前 Chain XIII 只有營地與角色 WebP 素材；下一步若補資產，優先建立小型、可驗證的 `character_bundle` 或 `monster_bundle`，不要一次擴張整套美術庫。

### 4. 地圖採分層思考，但依 Web 需求取捨

外部 workflow 的 layered map 概念可轉成 Chain XIII 的 Web 形式：

```text
base scene
+ separated props
+ placement metadata
+ y-sort / depth hint
+ collision or interaction zones
+ flattened preview
```

適合 Chain XIII 的用途：

- 營地設施熱點與可互動區域
- Run route 的背景、節點標記與 Boss 入口
- 戰鬥場景的背景、敵人位置與 FX anchor
- 未來可能的事件探索場景

目前不直接採用：

- Godot `TileMapLayer`
- Godot `Area2D`／`StaticBody2D`
- Unity scene 或 engine-specific prefab

這些屬於外部 engine handoff；Chain XIII 應改以 React component、CSS layer、資料型別與 Web metadata 實現相同概念。

### 5. QA metadata 是必要交接物

美術接入前至少確認：

- 檔案存在且路徑穩定
- 透明邊緣沒有洋紅 fringe 或殘留背景
- frame 尺寸一致
- frame 數與程式宣告一致
- anchor／對齊不會造成角色漂移
- 手機尺寸下不會裁切重要輪廓
- WebP／PNG 大小可接受
- 來源、授權與修改方式可追溯
- 實際在 Hermes preview 中檢查，而不是只通過 build

## 不直接採用的部分

### `$video2dsprite`

外部 README 明確標示完整影片轉 sprite 流程依賴 Grok Build 的 `image_to_video`。目前 Chain XIII 的 Codex／Hermes 開發環境不能假設有該工具，因此：

- 不把 `$video2dsprite` 當成目前可用依賴
- 不在程式或文件中承諾已完成影片轉 sprite
- 若已有合法影片或 frame，才考慮用本地 ffmpeg／Pillow 做可重現抽幀
- 正式角色 pixel sheet 仍優先使用可控的靜態 sprite／既有 frame

## Chain XIII 資產優先順序

1. **戰鬥可讀性資產**：普通怪、Elite、Boss 的辨識圖、受擊／勝負／獎勵回饋
2. **角色 bundle**：隊伍卡、戰鬥頭像、active skill icon、升星回饋
3. **遺物與基因鏈 icon**：讓 Run 資源與 Meta 資源一眼可分
4. **事件與探索場景 props**：支援事件選項，而不是只增加背景裝飾
5. **營地分層場景**：在互動熱點已穩定後，再把目前 baked WebP 漸進拆成 base／props／metadata

每一項都必須先通過玩家流程與手機 QA，再擴充同類素材。

## 開發規則

- 先修正玩家能否理解與完成流程，再增加裝飾性素材。
- 不以一張漂亮圖片宣稱完成一個資產系統；要有資料契約、接入位置與驗證。
- 外部 repository 只作方法參考；實際使用外部程式碼或素材時，另外記錄版本、授權與 attribution。
- 不把本機路徑、API token、密碼、OAuth 憑證或其他 secrets 寫進資產 metadata、文件或 commit。
- 每個可驗證的小資產階段仍遵循：測試／build → Hermes preview → commit → push → CI。
