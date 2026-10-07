import { useEffect, useState } from "react";
import CaseHome from "./components/CaseHome";
import HearScreen from "./components/HearScreen";
import WitnessChat from "./components/WitnessChat";
import EvidenceScreen from "./components/EvidenceScreen";
import CaseBoard from "./components/CaseBoard";
import TabBar, { type TabId } from "./components/TabBar";
import VerdictScreen from "./components/VerdictScreen";
import RevealScreen from "./components/RevealScreen";
import { useGameStore } from "./game/store";
import { track } from "./game/analytics";
import type { WitnessId } from "./game/types";

type Screen = "home" | "game" | "verdict" | "reveal";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [tab, setTab] = useState<TabId>("hear");
  const [activeWitness, setActiveWitness] = useState<WitnessId | null>(null);
  const board = useGameStore((s) => s.board);

  useEffect(() => {
    track("session_started", {});
  }, []);

  if (screen === "home") {
    return (
      <CaseHome
        onBegin={() => {
          setScreen("game");
        }}
      />
    );
  }

  if (screen === "verdict") {
    return (
      <VerdictScreen
        onBack={() => setScreen("game")}
        onSubmitted={() => setScreen("reveal")}
      />
    );
  }

  if (screen === "reveal") {
    return (
      <RevealScreen
        onReset={() => {
          useGameStore.getState().reset();
          setActiveWitness(null);
          setTab("hear");
          setScreen("home");
        }}
      />
    );
  }

  // screen === "game"
  if (activeWitness) {
    return <WitnessChat witnessId={activeWitness} onBack={() => setActiveWitness(null)} />;
  }

  return (
    <div className="min-h-full">
      {tab === "hear" && <HearScreen onSelect={setActiveWitness} />}
      {tab === "examine" && <EvidenceScreen />}
      {tab === "reason" && <CaseBoard />}
      <TabBar active={tab} onChange={setTab} onVerdict={() => setScreen("verdict")} boardCount={board.length} />
    </div>
  );
}
