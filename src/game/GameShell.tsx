import { useEffect, useRef, useState } from "react";
import { createEmptyMeta, createSaveEnvelope, mergeRunIntoMeta } from "../domain/save";
import { abandonRun, MAX_PARTY_SIZE, type RunDifficulty, type RunState } from "../domain/run";
import { loadFromIndexedDb, saveToIndexedDb } from "../services/persistence/indexedDb";
import GeneWorkshopView from "./GeneWorkshopView";
import GachaView from "./GachaView";
import CodexView from "./CodexView";
import PartyView from "./PartyView";
import RunSessionView, { type RunSessionPhase } from "./RunSessionView";
import TownView from "./TownView";
import type { GameView } from "./types";

const VIEW_ITEMS: Array<{ id: Exclude<GameView, "party" | "battle">; label: string; icon: string; hint: string }> = [
  { id: "town", label: "營地", icon: "營", hint: "目前位置" },
  { id: "route", label: "路線", icon: "路", hint: "選擇下一站" },
  { id: "workshop", label: "配置", icon: "配", hint: "選擇花色" },
  { id: "gacha", label: "抽卡", icon: "抽", hint: "取得角色" },
  { id: "codex", label: "圖鑑", icon: "鑑", hint: "查看遭遇" },
];

const VIEW_LABELS: Record<GameView, string> = { town: "遠征營地", party: "出戰隊伍", route: "遠征進行中", battle: "十三支戰鬥", workshop: "基因鏈配置", gacha: "角色抽卡", codex: "遠征圖鑑" };
const VIEW_RIBBONS: Record<GameView, string> = { town: "整備遠征隊：先選擇下一步要處理的事情", party: "隊伍編成：選 1～3 名角色組成出戰隊列", route: "遠征地圖：只選擇與目前位置相連的下一站", battle: "戰鬥進行中：用 13 張牌完成頭／中／尾三墩", workshop: "基因鏈配置：選擇墩位配置，再點選要啟用的元素格", gacha: "角色召集：用水晶擴充你的出戰選擇", codex: "遠征圖鑑：回看已遭遇的怪物與帶回的遺物" };
const RUN_PHASE_RIBBONS: Record<RunSessionPhase, string> = { route: "遠征地圖：只選擇與目前位置相連的下一站", battle: "戰鬥進行中：用 13 張牌完成頭／中／尾三墩", exploration: "事件現場：完成目標，決定這趟遠征的代價與收穫", altar: "遺物祭壇：保留想要的骰面，別讓 Skull 累積到 3 個", service: "遠征補給：用水晶、命數或情報換取下一步優勢", reward: "節點完成：領取獎勵，再選擇下一個方向", workshop: "基因鏈配置：選擇墩位配置，再點選要啟用的元素格", settlement: "遠征結算：確認本趟收穫並回到營地" };
const createRunSeed = () => `run-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;

export default function GameShell({ initialSeed }: { initialSeed?: string } = {}) {
  const persistenceSupported = typeof indexedDB !== "undefined";
  const [activeView, setActiveView] = useState<GameView>("town");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAbandonRun, setConfirmAbandonRun] = useState(false);
  const [meta, setMeta] = useState(() => createEmptyMeta());
  const [activeRun, setActiveRun] = useState<RunState>();
  const [hydrated, setHydrated] = useState(!persistenceSupported);
  const [persistenceError, setPersistenceError] = useState<"unsupported" | "load" | "save" | null>(() => persistenceSupported ? null : "unsupported");
  const [persistenceReady, setPersistenceReady] = useState(!persistenceSupported);
  const [partyCharacterIds, setPartyCharacterIds] = useState(() => meta.characters.map((character) => character.characterId));
  const [nextRunSeed, setNextRunSeed] = useState(() => initialSeed ?? createRunSeed());
  const [runDifficulty, setRunDifficulty] = useState<RunDifficulty>("normal");
  const [hasStartedRun, setHasStartedRun] = useState(false);
  const [runPhase, setRunPhase] = useState<RunSessionPhase>("route");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuDialogRef = useRef<HTMLDivElement>(null);
  const menuWasOpen = useRef(false);
  const ownedCharacterIds = meta.characters.map((character) => character.characterId);

  useEffect(() => {
    if (!menuOpen) {
      if (menuWasOpen.current) menuButtonRef.current?.focus();
      menuWasOpen.current = false;
      return;
    }
    menuWasOpen.current = true;
    const dialog = menuDialogRef.current;
    if (!dialog) return;
    const getFocusable = () => Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"));
    getFocusable()[0]?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setConfirmAbandonRun(false);
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [confirmAbandonRun, menuOpen]);

  useEffect(() => {
    if (!persistenceSupported) return;
    loadFromIndexedDb("default")
      .then((save) => {
        if (save) {
          setMeta(save.meta);
          setActiveRun(save.activeRun);
          if (save.activeRun) setActiveView("route");
          setPartyCharacterIds((save.activeRun?.partyCharacterIds ?? save.meta.characters.map((character) => character.characterId)).slice(0, MAX_PARTY_SIZE));
        }
        setPersistenceReady(true);
        setPersistenceError(null);
      })
      .catch(() => setPersistenceError("load"))
      .finally(() => setHydrated(true));
  }, [persistenceSupported]);

  useEffect(() => {
    if (!hydrated || !persistenceReady || !persistenceSupported) return;
    saveToIndexedDb("default", createSaveEnvelope(meta, activeRun)).then(() => setPersistenceError((current) => current === "save" ? null : current)).catch(() => setPersistenceError("save"));
  }, [activeRun, hydrated, meta, persistenceReady, persistenceSupported]);

  async function retryPersistence() {
    if (!persistenceSupported) return;
    if (persistenceError === "load") {
      try {
        const save = await loadFromIndexedDb("default");
        if (save) {
          setMeta(save.meta);
          setActiveRun(save.activeRun);
          if (save.activeRun) setActiveView("route");
          setPartyCharacterIds((save.activeRun?.partyCharacterIds ?? save.meta.characters.map((character) => character.characterId)).slice(0, MAX_PARTY_SIZE));
        }
        setPersistenceReady(true);
        setPersistenceError(null);
      } catch {
        setPersistenceError("load");
      }
      return;
    }
    try {
      await saveToIndexedDb("default", createSaveEnvelope(meta, activeRun));
      setPersistenceReady(true);
      setPersistenceError(null);
    } catch {
      setPersistenceError("save");
    }
  }

  function navigate(view: GameView) {
    if (view === "route" && !activeRun && activeView !== "party") {
      setActiveView("party");
      setMenuOpen(false);
      return;
    }
    if (activeRun && view !== "route") return;
    setActiveView(view);
    setMenuOpen(false);
  }

  function settleRun(run: RunState) {
    setMeta((current) => mergeRunIntoMeta(current, run));
    setActiveRun(undefined);
    setNextRunSeed(createRunSeed());
    setRunPhase("route");
    setActiveView("town");
    setMenuOpen(false);
    setConfirmAbandonRun(false);
  }

  function requestAbandonRun() {
    if (!activeRun || activeRun.status !== "active") return;
    setConfirmAbandonRun(true);
  }

  function confirmParty(characterIds: string[], difficulty: RunDifficulty) {
    setPartyCharacterIds(characterIds);
    setRunDifficulty(difficulty);
    if (hasStartedRun) setNextRunSeed(createRunSeed());
    setHasStartedRun(true);
  }

  function renderView() {
    if (activeView === "town") return <TownView crystals={meta.crystals} onNavigate={navigate} />;
    if (activeView === "party") return <PartyView ownedCharacterIds={ownedCharacterIds} selectedCharacterIds={partyCharacterIds} onConfirm={confirmParty} onNavigate={navigate} meta={meta} onMetaChange={setMeta} />;
    if (activeView === "route") return <RunSessionView partyCharacterIds={partyCharacterIds} difficulty={runDifficulty} seed={nextRunSeed} initialRun={activeRun} initialGeneInventory={meta.geneInventory} permanentSkillNodeIds={meta.permanentSkillNodeIds} onRunUpdated={setActiveRun} onRunSettled={settleRun} onPhaseChange={setRunPhase} />;
    if (activeView === "battle") return <RunSessionView partyCharacterIds={partyCharacterIds} difficulty={runDifficulty} seed={nextRunSeed} initialRun={activeRun} initialGeneInventory={meta.geneInventory} permanentSkillNodeIds={meta.permanentSkillNodeIds} onRunUpdated={setActiveRun} onRunSettled={settleRun} onPhaseChange={setRunPhase} />;
    if (activeView === "gacha") return <GachaView meta={meta} onMetaChange={setMeta} onNavigate={navigate} />;
    if (activeView === "codex") return <CodexView meta={meta} />;
    return <GeneWorkshopView initialInventory={meta.geneInventory} onInventoryChange={(geneInventory) => setMeta((current) => ({ ...current, geneInventory }))} onExit={() => setActiveView("town")} />;
  }

  if (!hydrated) return <main className="game-app"><div className="game-frame"><section className="game-screen" aria-label="讀取進度"><div className="loading-card" role="status">正在讀取本機進度…</div></section></div></main>;

  return <main className="game-app"><div className="game-frame">
    <header className="game-hud">
      <div className="game-brand"><span className="brand-mark">XIII</span><div><strong>CHAIN XIII</strong><span>花色鍊成版</span></div></div>
      <div className="screen-context" aria-live="polite"><span className="hud-label">現在</span><strong>{VIEW_LABELS[activeView]}</strong></div>
      <button ref={menuButtonRef} type="button" className="menu-button" onClick={() => setMenuOpen(true)} aria-label="開啟選單">≡</button>
    </header>

    <div className="game-viewport">
      <div className="quest-ribbon"><span className="status-dot" />{persistenceError === "unsupported" ? "本環境不支援本機存檔，本次進度只保留在目前頁面。" : persistenceError === "load" ? "本機存檔讀取失敗，請重試後再開始。" : persistenceError === "save" ? "進度未保存：本機存檔寫入失敗，請重試。" : activeRun ? RUN_PHASE_RIBBONS[runPhase] : VIEW_RIBBONS[activeView]}</div>
      <section className={`game-screen game-screen-${activeView}`} aria-label="遊戲畫面">{renderView()}</section>
      {menuOpen && <div className="system-overlay" role="dialog" aria-modal="true" aria-labelledby="system-dialog-title"><div ref={menuDialogRef} className="system-window"><h2 id="system-dialog-title">{confirmAbandonRun ? "放棄這趟遠征？" : "遊戲暫停"}</h2>{confirmAbandonRun ? <><p>這會清除目前遠征、放棄尚未領取的本趟獎勵，並回到營地。已經寫入的累積收穫會保留。</p><div className="system-actions"><button type="button" className="secondary-button" onClick={() => setConfirmAbandonRun(false)}>繼續遠征</button><button type="button" className="danger-button" onClick={() => activeRun && settleRun(abandonRun(activeRun))}>確認放棄這趟遠征</button></div></> : <><p>{persistenceError === "unsupported" ? "此環境不支援本機存檔，本次進度只會保留在目前頁面。" : persistenceError === "load" ? "本機存檔讀取失敗，尚未確認舊進度；請先重試。" : persistenceError === "save" ? "進度未保存：本機存檔寫入失敗。請重試保存後再離開。" : "目前進度會自動保存到這台裝置，回到遊戲即可繼續遠征。"}</p><div className="system-actions"><button type="button" className="pixel-button" onClick={() => setMenuOpen(false)}>返回遊戲</button>{persistenceError !== null && persistenceError !== "unsupported" && <button type="button" className="secondary-button" onClick={retryPersistence}>{persistenceError === "load" ? "重試讀取" : "重試保存"}</button>}{activeRun?.status === "active" && runPhase !== "battle" && <button type="button" className="danger-button" onClick={requestAbandonRun}>放棄這趟遠征</button>}</div></>}</div></div>}
    </div>

    <nav className="game-nav" aria-label="主要選單">{VIEW_ITEMS.filter((item) => activeRun ? item.id === "route" : true).map((item) => <button type="button" key={item.id} className={`game-nav-item${activeView === item.id ? " is-active" : ""}`} onClick={() => navigate(item.id)} aria-current={activeView === item.id ? "page" : undefined}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span><small>{item.hint}</small></button>)}</nav>
  </div></main>;
}