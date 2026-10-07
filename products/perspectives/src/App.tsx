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
import SoundToggle from "./components/SoundToggle";
import { useGameStore } from "./game/store";
import { track } from "./game/analytics";
import { playAmbient, stopAmbient } from "./game/audio";
import { WITNESS_BY_ID } from "./game/caseData";
import { CASE_INTRO_SLIDES, CHARACTER_INTRO_SLIDES } from "./game/introSlides";
import type { WitnessId } from "./game/types";

type Screen = "introCase" | "home" | "introCast" | "game" | "verdict" | "reveal";

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
  }, [screen]);

  if (screen === "introCase") {
    return <IntroSequence slides={CASE_INTRO_SLIDES} onDone={() => setScreen("home")} />;
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
    return <IntroSequence slides={CHARACTER_INTRO_SLIDES} onDone={() => setScreen("game")} />;
  }

  if (screen === "verdict") {
    return (
      <>
        <SoundToggle />
        <VerdictScreen onBack={() => setScreen("game")} onSubmitted={() => setScreen("reveal")} />
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
      {activeWitness ? (
        <WitnessChat
          witnessId={activeWitness}
          onBack={() => setActiveWitness(null)}
          onInspect={() => setDossierWitness(activeWitness)}
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
