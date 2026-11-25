import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  Download,
  Flame,
  X,
} from "lucide-react";

const navigation = [
  {
    label: "Overview",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Fire Map",
    path: "/map",
    icon: Map,
  },
  {
    label: "Activity Calendar",
    path: "/calendar",
    icon: CalendarDays,
  },
  {
    label: "Harmonized Calendar",
    path: "/harmonized",
    icon: CalendarRange,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Export Center",
    path: "/export",
    icon: Download,
  },
];

export default function Sidebar({ isOpen = false, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="primary-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-(--border-color) bg-(--surface) p-5 transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:translate-x-0 ${
          isOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full pointer-events-none lg:pointer-events-auto"
        }`}
      >
        <div className="mb-8 flex items-center justify-between gap-2 lg:mb-10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-2.5">
              <Flame className="text-orange-500" size={25} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                PyroScope
              </h1>

              <p className="text-xs text-(--text-secondary)">
                Satellite Intelligence
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-(--text-secondary) hover:bg-(--surface-secondary) hover:text-(--text-primary) lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-orange-500/10 text-orange-500"
                      : "text-(--text-secondary) hover:bg-(--surface-secondary) hover:text-(--text-primary)"
                  }`
                }
              >
                <Icon size={19} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}