import { CalendarDays, Clock, RefreshCw } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { MenuList } from "@/components/MenuList";
import { DicaDoDia } from "@/components/DicaDoDia";
import { MenuStatusBanner } from "@/components/MenuStatusBanner";
import { MealSelector } from "@/components/MealSelector";
import { getTodayIndex } from "@/data/menuData";
import { getRecommendationText } from "@/lib/recommendations";
import type { DayMenu, MealName } from "@/types";

interface HojeScreenProps {
  menu: DayMenu[];
  source: "live" | "cache" | "mock";
  loading: boolean;
  error: string | null;
  warning: string | null;
  fetchedAt: string | null;
  onRefetch: () => void;
  selectedMeal: MealName;
  onSelectedMealChange: (meal: MealName) => void;
}

function formatToday(): string {
  const now = new Date();
  const weekdays = [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
    "Quinta-feira", "Sexta-feira", "Sábado",
  ];
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${weekdays[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;
}

function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

export function HojeScreen({
  menu,
  source,
  loading,
  error,
  warning,
  fetchedAt,
  onRefetch,
  selectedMeal,
  onSelectedMealChange,
}: HojeScreenProps) {
  const todayIdx = getTodayIndex();
  // Nunca cai em dados de demonstração por conta própria: se o dia não existe
  // no cardápio carregado, mostramos "não disponível" em vez de dados falsos.
  const todayMenu = menu.length > 0 ? menu[todayIdx] : undefined;

  const mealCategories = todayMenu?.meals[selectedMeal] ?? [];
  const hasMealData = mealCategories.length > 0;

  const mealUnavailableMessage =
    selectedMeal === "Almoço"
      ? "Cardápio de almoço não disponível."
      : selectedMeal === "Jantar"
        ? "Cardápio de jantar não disponível."
        : "Cardápio não disponível.";

  return (
    <div className="min-h-screen pb-24">
      <AppHeader title="RU UFPE" subtitle="Restaurante Universitário" />

      <main className="mx-auto max-w-md px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <CalendarDays size={16} />
            <span className="text-sm font-medium capitalize">{formatToday()}</span>
          </div>
          <button
            onClick={onRefetch}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-primary-600 shadow-sm transition-colors hover:bg-primary-50 disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        <MenuStatusBanner
          source={source}
          loading={loading}
          error={error}
          warning={warning}
          fetchedAt={fetchedAt}
          onRefetch={onRefetch}
        />

        {isWeekend() && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3">
            <Clock size={18} className="mt-0.5 flex-shrink-0 text-primary-600" />
            <p className="text-sm text-primary-800">
              O RU não funciona nos finais de semana. Exibindo o cardápio de segunda-feira como referência.
            </p>
          </div>
        )}

        <h2 className="mb-3 text-xl font-bold text-gray-900">Cardápio de hoje</h2>

        <MealSelector
          selected={selectedMeal}
          onChange={onSelectedMealChange}
          availableMeals={["Almoço", "Jantar"]}
        />

        {hasMealData ? (
          <MenuList categories={mealCategories} />
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white px-4 py-8 shadow-sm">
            <p className="text-sm text-gray-500">{mealUnavailableMessage}</p>
          </div>
        )}

        <div className="mt-5">
          <DicaDoDia text={getRecommendationText(mealCategories)} />
        </div>
      </main>
    </div>
  );
}
