import { Home, CalendarDays, Settings } from "lucide-react";
import type { ScreenName } from "@/types";

interface BottomNavProps {
  active: ScreenName;
  onChange: (screen: ScreenName) => void;
}

const tabs: { id: ScreenName; label: string; icon: typeof Home }[] = [
  { id: "hoje", label: "Hoje", icon: Home },
  { id: "semana", label: "Semana", icon: CalendarDays },
  { id: "config", label: "Configurações", icon: Settings },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/90 backdrop-blur-lg safe-bottom">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="group relative flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={`flex h-9 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive ? "bg-primary-100 text-primary-700" : "text-gray-400 group-hover:text-gray-600"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  isActive ? "text-primary-700" : "text-gray-400 group-hover:text-gray-600"
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute -top-px h-0.5 w-8 rounded-full bg-primary-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
