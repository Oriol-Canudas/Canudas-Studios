// ─────────────────────────────────────────────────────────────────────────
// Minimal local analytics. No backend — logs to console and persists to
// localStorage so we can pull a session's event log off a phone for
// review. Good enough for a POC; swap for a real sink later if useful.
// ─────────────────────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | "session_started"
  | "evidence_inspected"
  | "evidence_inspected_detail"
  | "evidence_presented"
  | "witness_opened"
  | "witness_questioned"
  | "decision_selected"
  | "session_completed";

export interface AnalyticsRecord {
  event: AnalyticsEvent;
  payload?: Record<string, unknown>;
  t: number; // ms since epoch
}

const STORAGE_KEY = "perspective_events";
let sessionStart: number | null = null;

function readLog(): AnalyticsRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLog(log: AnalyticsRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // ignore (private browsing / storage full)
  }
}

export function track(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  const record: AnalyticsRecord = { event, payload, t: Date.now() };
  if (event === "session_started") sessionStart = record.t;

  // eslint-disable-next-line no-console
  console.info("[perspective:event]", event, payload ?? "");

  const log = readLog();
  log.push(record);
  writeLog(log);
}

export function sessionDurationMs(): number | null {
  if (sessionStart == null) return null;
  return Date.now() - sessionStart;
}

export function getEventLog(): AnalyticsRecord[] {
  return readLog();
}

export function clearEventLog() {
  writeLog([]);
  sessionStart = null;
}
