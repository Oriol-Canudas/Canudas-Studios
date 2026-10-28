import { useEffect, useState } from "react";
import { CASE_META, EVIDENCE, EXAMINE_HERO_IMAGE, WITNESSES } from "../game/caseData";
import { useGameStore } from "../game/store";
import { testimonyLinksForEvidence } from "../game/witnessEngine";
import { playSfx } from "../game/audio";
import type { EvidenceId } from "../game/types";

const CATEGORY_ICON: Record<string, string> = {
  physical: "\u{1F52A}",
  message: "\u{1F4AC}",
  video: "\u{1F3A5}",
  forensic: "\u{1F9EA}",
  records: "\u{1F4C4}",
};
const DEFAULT_CATEGORY_ICON = "\u{1F4CB}"; // a case can author its own categories; this is the fallback

// "Pending" replaces the old "Locked" — the document isn't forbidden, it
// just hasn't been pulled from the record yet, and tapping it is exactly
// how you do that. Cool/neutral tone signals "available, not yet taken,"
// not "blocked"; New and Read keep their existing, already-liked colors.
// Label text is overridable per case (CASE_META.pendingLabel) — "Request"
// reads investigative/forensic, wrong register for a workplace case.
function statusBadge(pendingLabel: string): Record<"pending" | "new" | "read", { label: string; className: string }> {
  return {
    pending: { label: pendingLabel, className: "bg-sky-300/15 text-sky-200 border border-sky-300/30" },
    new: { label: "● New", className: "bg-amber-400 text-black" },
    read: { label: "✓ Read", className: "bg-white/10 text-white/60 border border-white/10" },
  };
}

const DISCOVER_ANIMATION_MS = 480;

export default function EvidenceScreen() {
  const discovered = useGameStore((s) => s.discoveredEvidence);
  const inspected = useGameStore((s) => s.inspectedEvidence);
  const witnessStages = useGameStore((s) => s.witnessStages);
  const discoverEvidence = useGameStore((s) => s.discoverEvidence);
  const inspectEvidence = useGameStore((s) => s.inspectEvidence);
  const pendingEvidenceFocus = useGameStore((s) => s.pendingEvidenceFocus);
  const clearEvidenceFocus = useGameStore((s) => s.clearEvidenceFocus);
  const [open, setOpen] = useState<EvidenceId | null>(null);
  const [discovering, setDiscovering] = useState<EvidenceId | null>(null);

  const screenLabel = CASE_META.examineLabel ?? "Evidence";
  const pendingLabel = CASE_META.pendingLabel ?? "Request";
  const pendingCta = CASE_META.pendingCta ?? "Tap to request";
  const STATUS_BADGE = statusBadge(pendingLabel);

  const openItem = EVIDENCE.find((e) => e.id === open) ?? null;
  const testimonyLinks = openItem ? testimonyLinksForEvidence(openItem.id, WITNESSES, witnessStages) : [];

  function handleOpen(id: EvidenceId, alreadyDiscovered: boolean) {
    if (!alreadyDiscovered) {
      // Brief "pulling it from the record" beat — the card flashes and
      // settles into its New look before the detail sheet opens, instead
      // of the request and the read happening in the same instant.
      playSfx("documentUnseal");
      discoverEvidence(id);
      setDiscovering(id);
      window.setTimeout(() => {
        setDiscovering(null);
        inspectEvidence(id);
        setOpen(id);
      }, DISCOVER_ANIMATION_MS);
      return;
    }
    inspectEvidence(id);
    setOpen(id);
  }

  // Arriving here via a cross-reference link (e.g. a witness-chat nudge)
  // opens that evidence exactly as a direct tap would — same discover
  // animation if it's new, same detail sheet either way — then clears
  // the one-shot focus so revisiting this screen later doesn't reopen it.
  useEffect(() => {
    if (!pendingEvidenceFocus) return;
    handleOpen(pendingEvidenceFocus, discovered.has(pendingEvidenceFocus));
    clearEvidenceFocus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEvidenceFocus]);

  return (
    <div className="pb-28">
      <div className="relative h-32 w-full overflow-hidden">
        <img src={EXAMINE_HERO_IMAGE} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/30 to-transparent" />
      </div>

      <div className="px-5 pt-5">
        <h2 className="text-2xl font-semibold text-white">{screenLabel}</h2>
        <p className="mt-1 text-base text-white/55">
          Tap a card marked <span className="text-sky-300">{pendingLabel}</span> to pull it from the record.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {EVIDENCE.map((e) => {
            const isDiscovered = discovered.has(e.id);
            const isInspected = inspected.has(e.id);
            const isDiscovering = discovering === e.id;
            const status = !isDiscovered ? "pending" : isInspected ? "read" : "new";
            const badge = STATUS_BADGE[status];

            // Image cards — a real thumbnail of the document/scene, with
            // the "pending" ones deliberately desaturated and dimmed so
            // there's still a discovery beat when you pull them. Cases
            // that don't author images (e.image undefined) fall through
            // to the original flat icon-card treatment below, unchanged.
            if (e.image) {
              return (
                <button
                  key={e.id}
                  onClick={() => handleOpen(e.id, isDiscovered)}
                  disabled={isDiscovering}
                  className={`relative aspect-[4/5] overflow-hidden rounded-2xl text-left transition-all duration-300 ${
                    isDiscovering
                      ? "scale-105 shadow-[0_0_28px_rgba(251,191,36,0.5)]"
                      : "active:scale-[0.98]"
                  }`}
                >
                  <img
                    src={e.image}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${
                      status === "pending" ? "opacity-45 grayscale" : "opacity-100"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide shadow transition-opacity ${badge.className} ${isDiscovering ? "opacity-0" : "opacity-100"}`}
                  >
                    {badge.label}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-[15px] font-medium leading-snug text-white drop-shadow">{e.title}</p>
                    {!isDiscovered && <p className="mt-0.5 text-xs font-medium text-sky-200/80">{pendingCta}</p>}
                  </div>
                </button>
              );
            }

            return (
              <button
                key={e.id}
                onClick={() => handleOpen(e.id, isDiscovered)}
                disabled={isDiscovering}
                className={`relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-300 ${
                  isDiscovering
                    ? "scale-105 border-amber-300 bg-amber-300/15 shadow-[0_0_28px_rgba(251,191,36,0.5)]"
                    : `active:scale-[0.98] ${
                        status === "pending"
                          ? "border-dashed border-sky-300/25 bg-sky-300/[0.03]"
                          : status === "new"
                            ? "border-amber-300/40 bg-amber-300/[0.06]"
                            : "border-white/10 bg-white/[0.04]"
                      }`
                }`}
              >
                <span
                  className={`absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-opacity ${badge.className} ${isDiscovering ? "opacity-0" : "opacity-100"}`}
                >
                  {badge.label}
                </span>
                <span className={`text-2xl ${status === "pending" ? "opacity-60" : ""}`}>{CATEGORY_ICON[e.category] ?? DEFAULT_CATEGORY_ICON}</span>
                <span className="pr-14 text-base font-medium text-white">{e.title}</span>
                {isDiscovered ? (
                  <span className="text-sm text-white/50">{e.summary}</span>
                ) : (
                  <span className="text-sm font-medium text-sky-200/70">{pendingCta}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-screen takeover with a real hero image, instead of a
          text-only bottom sheet — matches how the rest of the app treats
          "look closely at this" moments (WitnessChat, VerdictScreen) and
          actually shows what you pulled, not just a caption describing it. */}
      {openItem && (
        <div className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-[#0a0a0d]">
          <div className="relative h-[38vh] w-full shrink-0 overflow-hidden">
            {openItem.image ? (
              <img src={openItem.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-white/[0.04]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-black/10 to-black/40" />
            <button
              onClick={() => setOpen(null)}
              className="absolute left-4 top-[calc(env(safe-area-inset-top)+12px)] flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-xl text-white backdrop-blur-sm active:text-white/70"
              aria-label="Back"
            >
              {"←"}
            </button>
          </div>

          <div className="flex-1 px-5 pb-16 pt-5">
            <p className="text-xs uppercase tracking-wide text-amber-300/80">{openItem.category}</p>
            <h3 className="mt-1 font-serif text-2xl font-semibold text-white">{openItem.title}</h3>
            <div className="mt-3 space-y-2">
              {openItem.details.map((d, i) => (
                <p key={i} className="text-[17px] leading-relaxed text-white/80">
                  {d}
                </p>
              ))}
            </div>
            {testimonyLinks.length > 0 && (
              <div className="mt-4 space-y-2">
                {testimonyLinks.map((link, i) => (
                  <div
                    key={`${link.witnessId}-${i}`}
                    className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2.5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/80">
                      {"⚡"} Connects to what {link.witnessName} said
                    </p>
                    <p className="mt-1 text-sm leading-snug text-white/75">"{link.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
