import { useGameStore } from "../game/store";
import { clarityCopy, computeClarity } from "../game/clarity";
import type { BoardEntry, BoardEntryType } from "../game/types";

const TYPE_STYLE: Record<BoardEntryType, { label: string; dot: string; text: string }> = {
  fact: { label: "Fact", dot: "bg-sky-400", text: "text-sky-200" },
  claim: { label: "Claim", dot: "bg-violet-400", text: "text-violet-200" },
  contradiction: { label: "Contradiction", dot: "bg-red-400", text: "text-red-200" },
  lead: { label: "Lead", dot: "bg-amber-300", text: "text-amber-200" },
};

/** Rough chronological sort for in-world time labels like "23:50" or "~00:02". */
function timeToMinutes(label?: string): number | null {
  if (!label) return null;
  const match = label.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 12) h += 24; // treat 00:xx / 0x:xx after-midnight times as later than 19:xx–23:xx
  return h * 60 + m;
}

function Section({ title, entries }: { title: string; entries: BoardEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="mb-2 text-base font-medium text-white/60">{title}</p>
      <div className="space-y-2">
        {entries.map((e) => {
          const style = TYPE_STYLE[e.type];
          return (
            <div key={e.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                <span className={`text-xs font-medium uppercase tracking-wide ${style.text}`}>
                  {style.label}
                  {e.timestamp ? ` · ${e.timestamp}` : ""}
                </span>
              </div>
              <p className="mt-1.5 text-[17px] leading-relaxed text-white/85">{e.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CaseBoard() {
  const board = useGameStore((s) => s.board);
  const discoveredEvidence = useGameStore((s) => s.discoveredEvidence);
  const witnessStages = useGameStore((s) => s.witnessStages);

  const clarity = computeClarity(discoveredEvidence, witnessStages);

  const timestamped = [...board]
    .filter((e) => e.timestamp)
    .sort((a, b) => (timeToMinutes(a.timestamp) ?? 0) - (timeToMinutes(b.timestamp) ?? 0));

  const contradictions = board.filter((e) => e.type === "contradiction");
  const facts = board.filter((e) => e.type === "fact");
  const claims = board.filter((e) => e.type === "claim" && !e.timestamp);

  return (
    <div className="px-5 pb-28 pt-6">
      <h2 className="text-2xl font-semibold text-white">Case board</h2>
      <p className="mt-1 text-base text-white/55">
        What you've actually established so far — nothing more.
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium uppercase tracking-wide text-white/60">Case clarity</p>
          <p className="text-lg font-semibold text-amber-300">{clarity}%</p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-500"
            style={{ width: `${clarity}%` }}
          />
        </div>
        <p className="mt-2 text-base text-white/60">{clarityCopy(clarity)}</p>
      </div>

      {board.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-6 text-center text-base text-white/45">
          Nothing pinned yet. Question witnesses and examine evidence — what you learn shows up here.
        </div>
      )}

      {timestamped.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-base font-medium text-white/60">Your timeline</p>
          <div className="space-y-0">
            {timestamped.map((e, i) => (
              <div key={e.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
                  {i < timestamped.length - 1 && <span className="w-px flex-1 bg-white/10" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-mono text-amber-300/80">{e.timestamp}</p>
                  <p className="mt-0.5 text-[17px] leading-snug text-white/85">{e.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Section title="Contradictions worth a closer look" entries={contradictions} />
      <Section title="Established facts" entries={facts} />
      <Section title="Claims (unverified testimony)" entries={claims} />
    </div>
  );
}
