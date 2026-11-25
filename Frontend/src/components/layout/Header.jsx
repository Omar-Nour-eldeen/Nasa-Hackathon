import { Sun, Moon, Bell, Menu, Flame } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function Header({ onMenuClick, isMenuOpen = false }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-(--border-color) bg-(--surface) px-3.5 sm:h-16 sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          aria-expanded={isMenuOpen}
          aria-controls="primary-sidebar"
          className="-ml-1.5 inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-(--text-secondary) hover:bg-(--surface-secondary) hover:text-(--text-primary) lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="shrink-0 rounded-lg bg-orange-500/10 p-1.5 lg:hidden">
          <Flame className="text-orange-500" size={18} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight lg:hidden">
            PyroScope
          </p>
          <p className="truncate text-[11px] text-(--text-secondary) lg:text-sm lg:font-medium lg:text-(--text-primary)">
            Fire Activity Explorer
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-lg p-2 text-(--text-secondary) hover:bg-(--surface-secondary)"
        >
          <Bell size={19} />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className="rounded-lg border border-(--border-color) p-2 hover:bg-(--surface-secondary)"
        >
          {theme === "dark" ? (
            <Sun size={19} />
          ) : (
            <Moon size={19} />
          )}
        </button>
      </div>
    </header>
  );
}