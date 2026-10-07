import { useState } from "react";
import { useGameStore } from "../game/store";
import type { ElenaVerdict, PlayerVerdict, ResponsibleParty } from "../game/types";

interface VerdictScreenProps {
  onBack: () => void;
  onSubmitted: () => void;
}

const RESPONSIBLE_OPTIONS: { id: ResponsibleParty; label: string }[] = [
  { id: "elena", label: "Elena" },
  { id: "sofia", label: "Sofia" },
  { id: "tom", label: "Tom" },
  { id: "someone_else", label: "Someone else" },
  { id: "insufficient_evidence", label: "Insufficient evidence" },
];

const ELENA_OPTIONS: { id: ElenaVerdict; label: string }[] = [
  { id: "guilty", label: "Guilty" },
  { id: "not_guilty", label: "Not guilty" },
  { id: "insufficient_evidence", label: "Insufficient evidence" },
];

export default function VerdictScreen({ onBack, onSubmitted }: VerdictScreenProps) {
  const submitVerdict = useGameStore((s) => s.submitVerdict);
  const inspectedEvidence = useGameStore((s) => s.inspectedEvidence);
  const chatHistory = useGameStore((s) => s.chatHistory);
  const [theory, setTheory] = useState("");
  const [responsible, setResponsible] = useState<ResponsibleParty | null>(null);
  const [elenaVerdict, setElenaVerdict] = useState<ElenaVerdict | null>(null);

  const documentsRead = inspectedEvidence.size;
  const witnessesQuestioned = Object.values(chatHistory).filter((h) => h.length > 0).length;
  const canSubmit = responsible !== null && elenaVerdict !== null;

  function handleSubmit() {
    if (!canSubmit) return;
    const v: PlayerVerdict = { theory, responsible, elenaVerdict };
    submitVerdict(v);
    onSubmitted();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3">
        <button onClick={onBack} className="text-2xl text-white/70 active:text-white">
          {"←"}
        </button>
        <p className="text-lg font-medium text-white">Deliver your verdict</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative h-32 w-full overflow-hidden">
          <img src="/scenes/verdict.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/20 to-transparent" />
        </div>

        <div className="px-5 pb-5 pt-5">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <span className="text-sm text-white/55">Where you stand right now</span>
            <span className="text-base font-medium text-white/80">
              {documentsRead}/8 documents read · {witnessesQuestioned}/5 witnesses
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-4">
            <p className="text-base font-medium text-red-200">This is final — it closes the case and reveals the truth.</p>
          </div>

          <div className="mt-6">
            <p className="text-base font-medium text-white/70">What happened? (optional)</p>
            <textarea
              value={theory}
              onChange={(e) => setTheory(e.target.value)}
              placeholder="In your own words…"
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] p-3.5 text-[17px] text-white placeholder:text-white/35 outline-none focus:border-amber-300/50"
            />
          </div>

          <div className="mt-6">
            <p className="text-base font-medium text-white/70">Who is responsible for Daniel's death?</p>
            <div className="mt-2 space-y-2">
              {RESPONSIBLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setResponsible(opt.id)}
                  className={`w-full rounded-xl border px-4 py-3.5 text-left text-[17px] transition-colors ${
                    responsible === opt.id
                      ? "border-amber-300/60 bg-amber-300/10 text-amber-100"
                      : "border-white/10 bg-white/[0.02] text-white/75"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-base font-medium text-white/70">Verdict on Elena</p>
            <div className="mt-2 space-y-2">
              {ELENA_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setElenaVerdict(opt.id)}
                  className={`w-full rounded-xl border px-4 py-3.5 text-left text-[17px] transition-colors ${
                    elenaVerdict === opt.id
                      ? "border-amber-300/60 bg-amber-300/10 text-amber-100"
                      : "border-white/10 bg-white/[0.02] text-white/75"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/40 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-2xl bg-amber-400 py-4 text-lg font-semibold text-black disabled:opacity-30 active:scale-[0.98] transition-transform"
        >
          Deliver verdict
        </button>
      </div>
    </div>
  );
}
