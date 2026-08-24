# 像素經營介面基礎

## 研究結論

本專案參考開羅遊戲公開截圖與訪談整理出可觀察的共同模式：

- 上方固定顯示日期、週期與資源，讓玩家隨時知道「現在」與「成長」的狀態。
- 中央是可點擊的像素場景；設施、角色與浮字同時提供空間感和即時回饋。
- 底部集中 Save、Menu、速度與主要操作，畫面大部分時間保持乾淨。
- 事件用短訊息、泡泡或數值跳字呈現，讓每次操作都有正向反饋。
- 美術不追求寫實，而是靠重複使用的小型素材、清楚的輪廓與高辨識色塊建立世界。

開羅的內部 engine 沒有完整公開文件，不能把平台實作細節當成已知事實。公開訪談可確認 2018 年 Switch 參入時已使用 Unity；因此本專案採用「平台無關的遊戲狀態層 + 可替換的畫面層」作為學習後的合理抽象。

參考資料：

- [Kairosoft 官方遊戲列表](https://kairopark.jp/android/en/)
- [官方 Game Dev Story II DX PC 畫面](https://kairosoft.net/game/pc/gamedev2.html)
- [Kairosoft 社長訪談（Unity／Switch）](https://news.denfaminicogamer.jp/interview/181218/2)
- [Game Dev Story office UI 的研究整理](https://www.diva-portal.org/smash/get/diva2:1973749/FULLTEXT01.pdf)

## 目前架構

```text
App
└── GameShell                 # HUD、週期、速度、主選單、畫面路由
    ├── TownView              # 像素地圖與設施情報
    ├── P0BattleLab           # 現有十三支規則垂直切片
    └── DevelopmentView       # 進度、Worker/D1 接點、設計準則
```

下一階段應把 `GameShell` 的暫時資源與週期狀態抽成可持久化的 game state，再接上 IndexedDB；戰鬥、花色鍊成與事件系統只透過狀態與事件接口溝通，避免各畫面互相耦合。
