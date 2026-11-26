export type MenuCategoryName =
  | "Entrada"
  | "Prato principal"
  | "Guarnição"
  | "Acompanhamento"
  | "Sobremesa"
  | "Bebida"
  | "Complemento";

export type MealName = "Desjejum" | "Almoço" | "Jantar";

export interface MenuItem {
  name: string;
  vegetarian?: boolean;
}

export interface MenuCategoryGroup {
  category: MenuCategoryName;
  items: MenuItem[];
}

export interface DayMenu {
  day: string;
  shortDay: string;
  meals: Record<MealName, MenuCategoryGroup[]>;
  dicaDoDia: string;
}

export type ScreenName = "hoje" | "semana" | "config";
