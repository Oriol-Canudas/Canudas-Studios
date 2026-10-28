import { useState } from "react";
import { CASE_META, EVIDENCE, VERDICT_AXES, VERDICT_HERO_IMAGE, WITNESSES } from "../game/caseData";
import { useGameStore } from "../game/store";
import type { PlayerVerdict } from "../game/types";
import PhaseHeader from "./PhaseHeader";

interface VerdictScreenProps {
  onBack: () => void;
  onSubmitted: () => void;
}

type Step = "statement" | "verdict" | "review";

export default function VerdictScreen({ onBack, onSubmitted }: VerdictScreenProps) {
  const submitVerdict = useGameStore((s) => s.submitVerdict);
  const inspectedEvidence = useGameStore((s) => s.inspectedEvidence);
  const chatHistory = useGameStore((s) => s.chatHistory);
  const board = useGameStore((s) => s.board);
  const [step, setStep] = useState<Step>("statement");
  const [theory, setTheory] = useState("");
  const [choices, setChoices] = useState<Record<string, string>>({});

  const documentsRead = inspectedEvidence.size;
  const witnessesQuestioned = Object.values(chatHistory).filter((h) => h.length > 0).length;
  const canSubmit = VERDICT_AXES.every((axis) => choices[axis.id] != null);

  function handleSubmit() {
    if (!canSubmit) return;
    const v: PlayerVerdict = { theory, choices };
    submitVerdict(v);
    onSubmitted();
  }

  // Step 1 is the entry point of this whole flow — its back arrow leaves
  // the verdict flow entirely. Step 2's back arrow instead returns to the
  // statement (never loses what was typed, since it's this component's
  // own state, not reset between steps) — closing a case is sequential,
  // not just one more form field among several. Step 3 (review) backs up
  // to step 2 so every choice stays editable right up to the real submit.
  function handleBack() {
    if (step === "review") setStep("verdict");
    else if (step === "verdict") setStep("statement");
    else onBack();
  }

  if (step === "statement") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3">
          <button onClick={handleBack} className="text-2xl text-white/70 active:text-white">
            {"←"}
          </button>
          <p className="text-lg font-medium text-white">{CASE_META.statementHeader}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-4">
            <PhaseHeader index={1} label="Your statement" />
          </div>
          <div className="relative mt-3 h-32 w-full overflow-hidden">
            <img src={VERDICT_HERO_IMAGE} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/20 to-transparent" />
          </div>

          <div className="px-5 pb-5 pt-6">
            <p className="text-2xl font-semibold leading-tight text-white">{CASE_META.statementHeadline}</p>
            <p className="mt-2 text-base leading-relaxed text-white/55">
              This is yours alone — it won't be graded against the record, and nothing you write here changes what
              actually happened. It's a record of where YOU landed, for you to look back on.
            </p>

            {board.length > 0 && (
              <p className="mt-3 text-sm text-white/35">You've pinned {board.length} item{board.length === 1 ? "" : "s"} to your case board — write from those, or from your gut.</p>
            )}

            <textarea
              value={theory}
              onChange={(e) => setTheory(e.target.value)}
              placeholder={CASE_META.statementPlaceholder}
              rows={8}
              autoFocus
              className="mt-5 w-full rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-[17px] leading-relaxed text-white placeholder:text-white/35 outline-none focus:border-amber-300/50"
            />
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/40 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <button
            onClick={() => setStep("verdict")}
            className="w-full rounded-2xl bg-amber-400 py-4 text-lg font-semibold text-black active:scale-[0.98] transition-transform"
          >
            {theory.trim() ? `Continue to ${CASE_META.decisionLabel.toLowerCase()}` : "Continue without writing a statement"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "verdict") {
    return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3">
        <button onClick={handleBack} className="text-2xl text-white/70 active:text-white">
          {"←"}
        </button>
        <p className="text-lg font-medium text-white">{CASE_META.decisionHeader}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-5 pt-5">
          <PhaseHeader index={2} label="Your decision" />

          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <span className="text-sm text-white/55">Where you stand right now</span>
            <span className="text-base font-medium text-white/80">
              {documentsRead}/{EVIDENCE.length} documents read · {witnessesQuestioned}/{WITNESSES.length} witnesses
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.03] px-3.5 py-2.5">
            <span className="shrink-0 text-base">{"⚠️"}</span>
            <p className="text-sm text-red-200/90">{CASE_META.finalWarning}</p>
          </div>

          {/* A simple progress readout instead of one long undifferentiated
              form — "2 of 4 answered," plus a dot per axis matching the
              same style IntroSequence already uses for its own beats. */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-white/50">
              {VERDICT_AXES.filter((axis) => choices[axis.id] != null).length} of {VERDICT_AXES.length} answered
            </p>
            <div className="flex gap-1.5">
              {VERDICT_AXES.map((axis) => (
                <span
                  key={axis.id}
                  className={`h-1.5 w-6 rounded-full ${choices[axis.id] != null ? "bg-amber-300" : "bg-white/15"}`}
                />
              ))}
            </div>
          </div>

          {VERDICT_AXES.map((axis) => (
            <div key={axis.id} className="mt-6">
              <p className="text-base font-medium text-white/70">{axis.question}</p>
              <div className="mt-2 space-y-2">
                {axis.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setChoices((c) => ({ ...c, [axis.id]: opt.id }))}
                    className={`w-full rounded-xl border px-4 py-3.5 text-left text-[17px] transition-colors ${
                      choices[axis.id] === opt.id
                        ? "border-amber-300/60 bg-amber-300/10 text-amber-100"
                        : "border-white/10 bg-white/[0.02] text-white/75"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/40 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <button
          onClick={() => canSubmit && setStep("review")}
          disabled={!canSubmit}
          className="w-full rounded-2xl bg-amber-400 py-4 text-lg font-semibold text-black disabled:opacity-30 active:scale-[0.98] transition-transform"
        >
          {canSubmit ? "Review your decision" : CASE_META.submitLabel}
        </button>
      </div>
    </div>
    );
  }

  // Step 3 — a consequence preview before the irreversible submit, modeled
  // on Concert's own pre-decision gate ("An agreement isn't a performance
  // yet."): what each choice actually means, spelled out, plus the cost
  // line the app already had (CASE_META.finalWarning) now framed as the
  // stakes of this specific action rather than a generic disclaimer — not
  // a new disclaimer tacked onto the same screen as the choices themselves.
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3">
        <button onClick={handleBack} className="text-2xl text-white/70 active:text-white">
          {"←"}
        </button>
        <p className="text-lg font-medium text-white">{CASE_META.decisionHeader}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-5 pt-5">
          <PhaseHeader index={2} label="Your decision" status="Final" />

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/90">Before you decide</p>
          <p className="mt-2 font-serif text-3xl leading-tight text-white">Make sure this is really your call.</p>

          <div className="mt-5 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
            {VERDICT_AXES.map((axis) => {
              const chosenLabel = axis.options.find((o) => o.id === choices[axis.id])?.label ?? "—";
              return (
                <div key={axis.id} className="px-4 py-3">
                  <p className="text-sm text-white/50">{axis.shortLabel ?? axis.question}</p>
                  <p className="mt-0.5 text-base font-medium text-white">{chosenLabel}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-l-2 border-amber-300/60 py-1 pl-3.5">
            <p className="text-[15px] italic leading-relaxed text-amber-100/90">{CASE_META.finalWarning}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/40 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <button
          onClick={handleSubmit}
          className="w-full rounded-2xl bg-amber-400 py-4 text-lg font-semibold text-black active:scale-[0.98] transition-transform"
        >
          {CASE_META.submitLabel}
        </button>
        <button onClick={() => setStep("verdict")} className="mt-3 w-full text-center text-sm text-white/50 underline">
          Change an answer
        </button>
      </div>
    </div>
  );
}
