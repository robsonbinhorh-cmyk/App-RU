import type { DayMenu } from "@/types";

/**
 * Cópia local (no celular) do último cardápio REAL obtido com sucesso.
 * Não tem prazo de validade: serve para abrir o app instantaneamente e para
 * continuar mostrando o cardápio quando estiver offline ou a UFPE cair.
 * Dados de demonstração nunca são gravados aqui.
 */

const STORAGE_KEY = "ru-ufpe-last-real-menu";

export interface StoredMenu {
  menu: DayMenu[];
  fetchedAt: string;
}

function looksLikeMenu(value: unknown): value is DayMenu[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (d) =>
        d &&
        typeof d === "object" &&
        typeof (d as DayMenu).day === "string" &&
        typeof (d as DayMenu).meals === "object" &&
        (d as DayMenu).meals !== null
    )
  );
}

export function loadLastRealMenu(): StoredMenu | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredMenu>;
    if (!looksLikeMenu(parsed.menu) || typeof parsed.fetchedAt !== "string") {
      return null;
    }
    return { menu: parsed.menu, fetchedAt: parsed.fetchedAt };
  } catch {
    return null;
  }
}

export function saveLastRealMenu(menu: DayMenu[], fetchedAt: string): void {
  if (!looksLikeMenu(menu)) return;
  try {
    const current = loadLastRealMenu();
    // Nunca troca um cardápio mais novo por um mais antigo.
    if (current && new Date(current.fetchedAt) > new Date(fetchedAt)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ menu, fetchedAt }));
  } catch {
    // armazenamento indisponível — não é fatal
  }
}

/** Texto curto de idade: "agora há pouco", "há 3 h", "há 2 dias". */
export function formatAge(fetchedAt?: string, now: number = Date.now()): string | null {
  if (!fetchedAt) return null;
  const ms = now - new Date(fetchedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const minutes = Math.floor(ms / 60000);
  if (minutes < 2) return "agora há pouco";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
}
