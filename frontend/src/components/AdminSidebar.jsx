import { ChevronLeft, ChevronRight, LayoutPanelLeft, X } from "lucide-react";

export function AdminSidebar({
  sections = [],
  active = "overview",
  onSelect,
  collapsed = false,
  onToggleCollapsed,
  mobileOpen = false,
  onCloseMobile,
}) {
  const shellClass = "border-white/15 bg-[linear-gradient(165deg,rgba(14,27,39,0.9),rgba(10,20,30,0.9))] text-white";
  const inactiveClass = "text-white/70 hover:bg-white/10";
  const activeClass = "bg-gradient-to-r from-sky/30 to-surf/30 text-white";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/45 transition lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onCloseMobile}
      />

      <aside
        className={`fixed left-0 top-20 z-50 h-[calc(100vh-5.5rem)] w-[86%] max-w-[320px] overflow-hidden rounded-r-2xl border p-3 shadow-2xl backdrop-blur-xl transition lg:sticky lg:top-24 lg:z-10 lg:h-[calc(100vh-7.5rem)] lg:max-w-none lg:rounded-2xl ${shellClass} ${mobileOpen ? "translate-x-0" : "-translate-x-[105%] lg:translate-x-0"} ${collapsed ? "lg:w-24" : "lg:w-72"}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-white/10 p-2">
              <LayoutPanelLeft size={16} />
            </span>
            {!collapsed ? <p className="font-display text-sm font-semibold">Admin Workspace</p> : null}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="hidden rounded-lg p-1.5 transition hover:bg-white/10 lg:inline-flex"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-lg p-1.5 transition hover:bg-white/10 lg:hidden"
              title="Close menu"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="no-scrollbar grid gap-1 overflow-y-auto pr-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = active === section.key;

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => {
                  onSelect?.(section.key);
                  onCloseMobile?.();
                }}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${isActive ? activeClass : inactiveClass}`}
                title={section.label}
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-current/20">
                  <Icon size={15} />
                </span>
                {!collapsed ? <span className="truncate">{section.label}</span> : null}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
