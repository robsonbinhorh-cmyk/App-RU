import { Check, Leaf } from "lucide-react";
import type { MenuCategoryGroup, MenuCategoryName } from "@/types";

interface MenuListProps {
  categories: MenuCategoryGroup[];
}

const categoryStyles: Record<MenuCategoryName, { bg: string; text: string; icon: string }> = {
  "Entrada": { bg: "bg-emerald-50", text: "text-emerald-700", icon: "bg-emerald-500" },
  "Prato principal": { bg: "bg-primary-50", text: "text-primary-700", icon: "bg-primary-600" },
  "Guarnição": { bg: "bg-amber-50", text: "text-amber-700", icon: "bg-amber-500" },
  "Acompanhamento": { bg: "bg-orange-50", text: "text-orange-700", icon: "bg-orange-500" },
  "Sobremesa": { bg: "bg-pink-50", text: "text-pink-700", icon: "bg-pink-500" },
  "Bebida": { bg: "bg-sky-50", text: "text-sky-700", icon: "bg-sky-500" },
  "Complemento": { bg: "bg-violet-50", text: "text-violet-700", icon: "bg-violet-500" },
};

export function MenuList({ categories }: MenuListProps) {
  return (
    <div className="space-y-3">
      {categories.map((group) => {
        const style = categoryStyles[group.category];
        return (
          <div
            key={group.category}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <div className={`flex items-center gap-3 px-4 py-3 ${style.bg}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${style.icon}`} />
              <h3 className={`text-sm font-semibold uppercase tracking-wide ${style.text}`}>
                {group.category}
              </h3>
            </div>
            <ul className="divide-y divide-gray-50">
              {group.items.map((item, idx) => (
                <li
                  key={`${item.name}-${idx}`}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text}`}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="text-[15px] leading-snug text-gray-700">{item.name}</span>
                  {item.vegetarian && (
                    <span className="ml-auto flex flex-shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                      <Leaf size={10} />
                      Veg
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
