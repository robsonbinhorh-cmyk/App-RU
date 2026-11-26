import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { MenuList } from "@/components/MenuList";
import { DicaDoDia } from "@/components/DicaDoDia";
import { MenuStatusBanner } from "@/components/MenuStatusBanner";
import { MealSelector } from "@/components/MealSelector";
import { getTodayIndex } from "@/data/menuData";
import { getRecommendationText } from "@/lib/recommendations";
import { getPrioritizedMeal } from "@/lib/mealTime";
import type { DayMenu, MealName } from "@/types";

interface SemanaScreenProps {
  menu: DayMenu[];
  source: "live" | "cache" | "mock";
  loading: boolean;
  error: string | null;
  warning: string | null;
  fetchedAt: string | null;
  onRefetch: () => void;
}

export function SemanaScreen({
  menu,
  source,
  loading,
  error,
  warning,
  fetchedAt,
  onRefetch,
}: SemanaScreenProps) {
  const todayIdx = getTodayIndex();
  const [selected, setSelected] = useState(todayIdx);

  const prioritizedMeal = getPrioritizedMeal();
  const [selectedMeal, setSelectedMeal] = useState<MealName>(
    prioritizedMeal ?? "Almoço"
  );

  // Sem dados carregados (ex.: primeira abertura ainda carregando) mostramos
  // lista vazia, nunca dados de demonstração.
  const weekMenu = menu;
  const safeIdx = Math.max(0, Math.min(selected, weekMenu.length - 1));
  const dayMenu = weekMenu[safeIdx];
  const isToday = safeIdx === todayIdx;

  const mealCategories = dayMenu?.meals[selectedMeal] ?? [];
  const hasMealData = mealCategories.length > 0;

  const mealUnavailableMessage =
    selectedMeal === "Almoço"
      ? "Cardápio de almoço não disponível."
      : selectedMeal === "Jantar"
        ? "Cardápio de jantar não disponível."
        : "Cardápio não disponível.";

  return (
    <div className="min-h-screen pb-24">
      <AppHeader title="Cardápio da semana" subtitle="Segunda a sexta-feira" />

      <main className="mx-auto max-w-md px-5 py-5">
        <MenuStatusBanner
          source={source}
          loading={loading}
          error={error}
          warning={warning}
          fetchedAt={fetchedAt}
          onRefetch={onRefetch}
        />

        <div className="mb-5 flex items-center justify-end">
          <button
            onClick={onRefetch}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-primary-600 shadow-sm transition-colors hover:bg-primary-50 disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        <div className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
          {weekMenu.map((day, idx) => {
            const active = idx === safeIdx;
            const isTodayPill = idx === todayIdx;
            return (
              <button
                key={day.day}
                onClick={() => setSelected(idx)}
                className={`relative flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-3 transition-all duration-200 ${
                  active
                    ? "bg-primary-600 text-white shadow-md shadow-primary-600/30"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className={`text-xs font-medium ${active ? "text-primary-100" : "text-gray-400"}`}>
                  {day.shortDay}
                </span>
                <span className="text-lg font-bold leading-none">{idx + 1}</span>
                {isTodayPill && (
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${active ? "bg-white" : "bg-primary-500"}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{dayMenu?.day ?? "Cardápio"}</h2>
          {isToday && (
            <span className="mt-1 inline-block rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
              Hoje
            </span>
          )}
        </div>

        <MealSelector
          selected={selectedMeal}
          onChange={setSelectedMeal}
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
