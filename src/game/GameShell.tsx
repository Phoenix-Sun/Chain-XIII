import { useEffect, useState } from "react";
import { createEmptyMeta, createSaveEnvelope, mergeRunIntoMeta } from "../domain/save";
import type { RunState } from "../domain/run";
import { loadFromIndexedDb, saveToIndexedDb } from "../services/persistence/indexedDb";
import GeneWorkshopView from "./GeneWorkshopView";
import GachaView from "./GachaView";
import PartyView from "./PartyView";
import RunSessionView from "./RunSessionView";
import TownView from "./TownView";
import type { GameView } from "./types";

const VIEW_ITEMS: Array<{ id: Exclude<GameView, "party" | "battle">; label: string; icon: string; hint: string }> = [
  { id: "town", label: "營地", icon: "營", hint: "目前位置" },
  { id: "route", label: "路線", icon: "路", hint: "選擇下一站" },
  { id: "workshop", label: "鍊成", icon: "鍊", hint: "改造花色" },
  { id: "gacha", label: "抽卡", icon: "抽", hint: "取得角色" },
];

const VIEW_LABELS: Record<GameView, string> = { town: "遠征營地", party: "出戰隊伍", route: "遠征進行中", battle: "十三支戰鬥", workshop: "基因鏈鍊成", gacha: "角色抽卡" };
const createRunSeed = () => `run-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;

export default function GameShell({ initialSeed }: { initialSeed?: string } = {}) {
  const persistenceSupported = typeof indexedDB !== "undefined";
  const [activeView, setActiveView] = useState<GameView>("town");
  const [menuOpen, setMenuOpen] = useState(false);
  const [meta, setMeta] = useState(() => createEmptyMeta());
  const [activeRun, setActiveRun] = useState<RunState>();
  const [hydrated, setHydrated] = useState(!persistenceSupported);
  const [persistenceFailed, setPersistenceFailed] = useState(false);
  const [partyCharacterIds, setPartyCharacterIds] = useState(() => meta.characters.map((character) => character.characterId));
  const [nextRunSeed, setNextRunSeed] = useState(() => initialSeed ?? createRunSeed());
  const [hasStartedRun, setHasStartedRun] = useState(false);
  const ownedCharacterIds = meta.characters.map((character) => character.characterId);

  useEffect(() => {
    if (!persistenceSupported) return;
    loadFromIndexedDb("default")
      .then((save) => {
        if (!save) return;
        setMeta(save.meta);
        setActiveRun(save.activeRun);
        if (save.activeRun) setActiveView("route");
        setPartyCharacterIds(save.activeRun?.partyCharacterIds ?? save.meta.characters.map((character) => character.characterId));
      })
      .catch(() => setPersistenceFailed(true))
      .finally(() => setHydrated(true));
  }, [persistenceSupported]);

  useEffect(() => {
    if (!hydrated || persistenceFailed || !persistenceSupported) return;
    saveToIndexedDb("default", createSaveEnvelope(meta, activeRun)).catch(() => undefined);
  }, [activeRun, hydrated, meta, persistenceFailed, persistenceSupported]);

  function navigate(view: GameView) {
    if (activeRun && view !== "route") return;
    setActiveView(view);
    setMenuOpen(false);
  }

  function settleRun(run: RunState) {
    setMeta((current) => mergeRunIntoMeta(current, run));
    setActiveRun(undefined);
    setNextRunSeed(createRunSeed());
    setActiveView("town");
  }

  function confirmParty(characterIds: string[]) {
    setPartyCharacterIds(characterIds);
    if (hasStartedRun) setNextRunSeed(createRunSeed());
    setHasStartedRun(true);
  }

  function renderView() {
    if (activeView === "town") return <TownView crystals={meta.crystals} onNavigate={navigate} />;
    if (activeView === "party") return <PartyView ownedCharacterIds={ownedCharacterIds} selectedCharacterIds={partyCharacterIds} onConfirm={confirmParty} onNavigate={navigate} meta={meta} onMetaChange={setMeta} />;
    if (activeView === "route") return <RunSessionView partyCharacterIds={partyCharacterIds} seed={nextRunSeed} initialRun={activeRun} initialGeneInventory={meta.geneInventory} onRunUpdated={setActiveRun} onRunSettled={settleRun} />;
    if (activeView === "battle") return <RunSessionView partyCharacterIds={partyCharacterIds} seed={nextRunSeed} initialRun={activeRun} initialGeneInventory={meta.geneInventory} onRunUpdated={setActiveRun} onRunSettled={settleRun} />;
    if (activeView === "gacha") return <GachaView meta={meta} onMetaChange={setMeta} onNavigate={navigate} />;
    return <GeneWorkshopView initialInventory={meta.geneInventory} onInventoryChange={(geneInventory) => setMeta((current) => ({ ...current, geneInventory }))} onExit={() => setActiveView("town")} />;
  }

  if (!hydrated) return <main className="game-app"><div className="game-frame"><section className="game-screen" aria-label="讀取進度"><div className="loading-card" role="status">正在讀取本機進度…</div></section></div></main>;

  return <main className="game-app"><div className="game-frame">
    <header className="game-hud">
      <div className="game-brand"><span className="brand-mark">XIII</span><div><strong>CHAIN XIII</strong><span>花色鍊成版</span></div></div>
      <div className="screen-context" aria-live="polite"><span className="hud-label">現在</span><strong>{VIEW_LABELS[activeView]}</strong></div>
      <button type="button" className="menu-button" onClick={() => setMenuOpen(true)} aria-label="開啟選單">≡</button>
    </header>

    <div className="game-viewport">
      <div className="quest-ribbon"><span className="status-dot" />{persistenceFailed ? "本機存檔暫時不可用，本次進度只保留在目前頁面。" : "先選擇目前要處理的事情"}</div>
      <section className={`game-screen game-screen-${activeView}`} aria-label="遊戲畫面">{renderView()}</section>
      {menuOpen && <div className="system-overlay" role="dialog" aria-modal="true" aria-label="系統選單"><div className="system-window"><span className="pixel-kicker">SYSTEM</span><h2>遊戲暫停</h2><p>目前進度會自動保存到這台裝置，回到遊戲即可繼續遠征。</p><button type="button" className="pixel-button" onClick={() => setMenuOpen(false)}>返回遊戲</button></div></div>}
    </div>

    <nav className="game-nav" aria-label="主要選單">{VIEW_ITEMS.filter((item) => activeRun ? item.id === "route" : true).map((item) => <button type="button" key={item.id} className={`game-nav-item${activeView === item.id ? " is-active" : ""}`} onClick={() => navigate(item.id)} aria-current={activeView === item.id ? "page" : undefined}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span><small>{item.hint}</small></button>)}</nav>
  </div></main>;
}