import type { DayMenu } from "@/types";

/**
 * Produces a stable string signature of the menu content.
 * Only food item names and categories are included — metadata
 * like dicaDoDia (a static string) is excluded so that cosmetic
 * changes don't trigger false "new menu" notifications.
 */
export function menuSignature(menu: DayMenu[]): string {
  return JSON.stringify(
    menu.map((d) => ({
      day: d.day,
      meals: Object.fromEntries(
        Object.entries(d.meals).map(([meal, cats]) => [
          meal,
          cats.map((c) => ({
            category: c.category,
            items: c.items.map((i) => i.name),
          })),
        ])
      ),
    }))
  );
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
