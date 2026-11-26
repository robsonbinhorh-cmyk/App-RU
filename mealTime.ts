import type { MealName } from "@/types";

/**
 * Determines which meal should be initially prioritized based on local time.
 *
 * - 06:00–14:00 → Almoço
 * - 15:00–17:00 → Jantar
 * - Otherwise → null (no automatic prioritization)
 *
 * This only affects the initial selection; the user can always switch manually.
 */
export function getPrioritizedMeal(): MealName | null {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return "Almoço";
  if (hour >= 15 && hour < 17) return "Jantar";
  return null;
}
