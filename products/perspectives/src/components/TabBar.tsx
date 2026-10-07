export type TabId = "hear" | "examine" | "reason";

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  onVerdict: () => void;
  boardCount: number;
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "hear", label: "Hear", icon: "\u{1F5E8}️" },
  { id: "examine", label: "Examine", icon: "\u{1F50E}" },
  { id: "reason", label: "Reason", icon: "\u{1F9E9}" },
];

export default function TabBar({ active, onChange, onVerdict, boardCount }: TabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/80 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
              active === tab.id ? "text-amber-300" : "text-white/50"
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
            {tab.id === "reason" && boardCount > 0 && (
              <span className="absolute right-6 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-black">
                {boardCount}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={onVerdict}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold text-red-300"
        >
          <span className="text-lg leading-none">{"⚖️"}</span>
          Verdict
        </button>
      </div>
    </div>
  );
}
