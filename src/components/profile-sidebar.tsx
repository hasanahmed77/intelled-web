"use client";

const NAV_ITEMS = [
  { tab: "overview",     label: "Overview",     icon: "◈" },
  { tab: "progress",     label: "Progress",     icon: "⬆" },
  { tab: "badges",       label: "Badges",       icon: "✦" },
  { tab: "sets",         label: "Problem Sets", icon: "≡" },
  { tab: "subscription", label: "Subscription", icon: "◇" },
] as const;

export type ProfileTab = (typeof NAV_ITEMS)[number]["tab"];

type ProfileSidebarProps = {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  badgeCount: number;
};

export function ProfileSidebar({ activeTab, onTabChange, badgeCount }: ProfileSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-52 shrink-0 lg:block">
        <nav className="sticky top-[calc(var(--navbar-h)+1.5rem)] flex flex-col gap-1">
          {NAV_ITEMS.map(({ tab, label, icon }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-ink-900 text-accent"
                    : "text-zinc-400 hover:bg-ink-900/60 hover:text-zinc-200"
                }`}
              >
                <span className="text-base leading-none opacity-70">{icon}</span>
                <span>{label}</span>
                {tab === "badges" && badgeCount > 0 && (
                  <span className="ml-auto rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-accent">
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile tab strip */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
        {NAV_ITEMS.map(({ tab, label }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition ${
                isActive
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-ink-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}
