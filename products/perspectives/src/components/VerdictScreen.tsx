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
  const [theory, setTheory] = useState("");
  const [responsible, setResponsible] = useState<ResponsibleParty | null>(null);
  const [elenaVerdict, setElenaVerdict] = useState<ElenaVerdict | null>(null);

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
        <button onClick={onBack} className="text-xl text-white/70 active:text-white">
          {"←"}
        </button>
        <p className="font-medium text-white">Deliver your verdict</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-4">
          <p className="text-sm font-medium text-red-200">This is final.</p>
          <p className="mt-1 text-[15px] leading-relaxed text-white/70">
            Once you deliver your verdict, the case closes and the truth is revealed.
          </p>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-white/70">What happened? (optional)</p>
          <textarea
            value={theory}
            onChange={(e) => setTheory(e.target.value)}
            placeholder="In your own words…"
            rows={3}
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] p-3 text-[15px] text-white placeholder:text-white/35 outline-none focus:border-amber-300/50"
          />
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-white/70">Who is responsible for Daniel's death?</p>
          <div className="mt-2 space-y-2">
            {RESPONSIBLE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setResponsible(opt.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-[15px] transition-colors ${
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
          <p className="text-sm font-medium text-white/70">Verdict on Elena</p>
          <div className="mt-2 space-y-2">
            {ELENA_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setElenaVerdict(opt.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-[15px] transition-colors ${
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
