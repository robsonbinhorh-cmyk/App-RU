import { UtensilsCrossed } from "lucide-react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-primary-700 to-primary-600 px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] text-white shadow-lg shadow-primary-900/20">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <UtensilsCrossed size={20} />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-primary-100">{subtitle}</p>}
          </div>
        </div>
      </div>
    </header>
  );
}
