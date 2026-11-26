import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { HojeScreen } from "@/screens/HojeScreen";
import { SemanaScreen } from "@/screens/SemanaScreen";
import { ConfigScreen } from "@/screens/ConfigScreen";
import { useMenu } from "@/hooks/useMenu";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";
import { getPrioritizedMeal } from "@/lib/mealTime";
import type { ScreenName, MealName } from "@/types";

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("hoje");
  const { prefs, toggleNovoCardapio, toggleDicaDoDia, toggleCardapioDoDia } = useNotificationPrefs();

  const [selectedMeal, setSelectedMeal] = useState<MealName>(
    getPrioritizedMeal() ?? "Almoço"
  );

  const { menu, source, loading, error, warning, fetchedAt, refetch } = useMenu({
    prefs,
    selectedMeal,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div key={screen} className="animate-fade-in">
        {screen === "hoje" && (
          <HojeScreen
            menu={menu}
            source={source}
            loading={loading}
            error={error}
            warning={warning}
            fetchedAt={fetchedAt}
            onRefetch={refetch}
            selectedMeal={selectedMeal}
            onSelectedMealChange={setSelectedMeal}
          />
        )}
        {screen === "semana" && (
          <SemanaScreen
            menu={menu}
            source={source}
            loading={loading}
            error={error}
            warning={warning}
            fetchedAt={fetchedAt}
            onRefetch={refetch}
          />
        )}
        {screen === "config" && (
          <ConfigScreen
            prefs={prefs}
            onToggleNovoCardapio={toggleNovoCardapio}
            onToggleDicaDoDia={toggleDicaDoDia}
            onToggleCardapioDoDia={toggleCardapioDoDia}
          />
        )}
      </div>
      <BottomNav active={screen} onChange={setScreen} />
    </div>
  );
}
