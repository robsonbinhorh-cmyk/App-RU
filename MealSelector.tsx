import type { MealName } from "@/types";

interface MealSelectorProps {
  selected: MealName;
  onChange: (meal: MealName) => void;
  availableMeals?: MealName[];
}

export function MealSelector({
  selected,
  onChange,
  availableMeals = ["Almoço", "Jantar"],
}: MealSelectorProps) {
  const labels: Record<MealName, string> = {
    Desjejum: "Desjejum",
    Almoço: "Almoço",
    Jantar: "Jantar",
  };

  return (
    <div className="mb-4 inline-flex rounded-2xl bg-gray-100 p-1">
      {availableMeals.map((meal) => {
        const active = meal === selected;
        return (
          <button
            key={meal}
            onClick={() => onChange(meal)}
            className={`relative rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200 ${
              active
                ? "bg-white text-primary-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {labels[meal]}
          </button>
        );
      })}
    </div>
  );
}
