import { useEffect, useState } from "react";
import IntroSequence from "./components/IntroSequence";
import CaseHome from "./components/CaseHome";
import HearScreen from "./components/HearScreen";
import WitnessChat from "./components/WitnessChat";
import CharacterDossier from "./components/CharacterDossier";
import EvidenceScreen from "./components/EvidenceScreen";
import CaseBoard from "./components/CaseBoard";
import TabBar, { type TabId } from "./components/TabBar";
import VerdictScreen from "./components/VerdictScreen";
import RevealScreen from "./components/RevealScreen";
import ConfrontationScene from "./components/ConfrontationScene";
import SoundToggle from "./components/SoundToggle";
import TimeClock from "./components/TimeClock";
import BreakthroughToast from "./components/BreakthroughToast";
import { useGameStore } from "./game/store";
import { track } from "./game/analytics";
import { playAmbient, stopAmbient } from "./game/audio";
import { CASE_INTRO_MODE, CONFRONTATION_WITNESS_IDS, WITNESS_BY_ID } from "./game/caseData";
import { CASE_INTRO_SLIDES, CHARACTER_INTRO_SLIDES } from "./game/introSlides";
import type { WitnessId } from "./game/types";

type Screen = "introCase" | "home" | "introCast" | "game" | "verdict" | "confront" | "reveal";

export default function App() {
  const [screen, setScreen] = useState<Screen>("introCase");
  const [tab, setTab] = useState<TabId>("hear");
  const [activeWitness, setActiveWitness] = useState<WitnessId | null>(null);
  const [dossierWitness, setDossierWitness] = useState<WitnessId | null>(null);
  const board = useGameStore((s) => s.board);

  useEffect(() => {
    track("session_started", {});
  }, []);

  useEffect(() => {
    if (screen === "reveal") stopAmbient(); // let the gavel SFX land in near-silence
    if (screen === "introCase") {
      // Best-effort autoplay — not a real user gesture yet, so strict mobile
      // browsers (notably iOS Safari) will silently block this. The later
      // "Begin the case" tap is the guaranteed unlock; calling playAmbient()
      // again there is a safe no-op if this already succeeded.
      playAmbient();
    }
  }, [screen]);

  if (screen === "introCase") {
    return <IntroSequence slides={CASE_INTRO_SLIDES} onDone={() => setScreen("home")} {...CASE_INTRO_MODE} />;
  }

  if (screen === "home") {
    return (
      <CaseHome
        onBegin={() => {
          playAmbient(); // real user gesture — satisfies mobile autoplay rules
          setScreen("introCast");
        }}
      />
    );
  }

  if (screen === "introCast") {
    return <IntroSequence slides={CHARACTER_INTRO_SLIDES} slideMs={4400} onDone={() => setScreen("game")} />;
  }

  if (screen === "verdict") {
    return (
      <>
        <SoundToggle />
        <TimeClock />
        <VerdictScreen
          onBack={() => setScreen("game")}
          onSubmitted={() => setScreen(CONFRONTATION_WITNESS_IDS.length > 0 ? "confront" : "reveal")}
        />
      </>
    );
  }

  if (screen === "confront") {
    return (
      <>
        <SoundToggle />
        <ConfrontationScene onDone={() => setScreen("reveal")} />
      </>
    );
  }

  if (screen === "reveal") {
    return (
      <>
        <SoundToggle />
        <RevealScreen
          onReset={() => {
            useGameStore.getState().reset();
            setActiveWitness(null);
            setDossierWitness(null);
            setTab("hear");
            setScreen("introCase");
          }}
        />
      </>
    );
  }

  // screen === "game"
  return (
    <>
      <SoundToggle />
      <TimeClock />
      <BreakthroughToast />
      {activeWitness ? (
        <WitnessChat
          witnessId={activeWitness}
          onBack={() => setActiveWitness(null)}
          onInspect={() => setDossierWitness(activeWitness)}
          onViewEvidence={(evidenceId) => {
            setActiveWitness(null);
            setTab("examine");
            useGameStore.getState().focusEvidence(evidenceId);
          }}
        />
      ) : (
        <div className="min-h-full">
          {tab === "hear" && <HearScreen onSelect={setActiveWitness} onInspect={setDossierWitness} />}
          {tab === "examine" && <EvidenceScreen />}
          {tab === "reason" && <CaseBoard />}
          <TabBar active={tab} onChange={setTab} onVerdict={() => setScreen("verdict")} boardCount={board.length} />
        </div>
      )}

      {dossierWitness && (
        <CharacterDossier
          witness={WITNESS_BY_ID[dossierWitness]}
          onClose={() => setDossierWitness(null)}
          onQuestion={() => {
            setActiveWitness(dossierWitness);
            setDossierWitness(null);
          }}
        />
      )}
    </>
  );
}
