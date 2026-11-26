import type { DayMenu } from "@/types";
import { weekMenu as mockWeekMenu } from "@/data/menuData";
import { supabase } from "@/lib/supabase";
import { loadLastRealMenu, saveLastRealMenu } from "@/lib/menuStore";

export interface UfpeMenuResponse {
  success: boolean;
  source: "live" | "cache" | "error";
  source_url?: string;
  fetched_at?: string;
  menu: DayMenu[];
  warning?: string;
  error?: string;
}

export interface FetchResult {
  menu: DayMenu[];
  source: "live" | "cache" | "mock";
  fetchedAt?: string;
  warning?: string;
}

const EDGE_FUNCTION_PATH = "/functions/v1/ufpe-menu";
const CLIENT_FETCH_TIMEOUT_MS = 20000;

function getEdgeFunctionUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  return `${supabaseUrl}${EDGE_FUNCTION_PATH}`;
}

function getAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY as string;
}

async function fetchWithClientTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAnonKey()}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Tempo limite excedido (${timeoutMs}ms)`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function readCacheDirectly(): Promise<FetchResult | null> {
  try {
    const { data, error } = await supabase
      .from("ru_menu_cache")
      .select("menu_json, fetched_at")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    if (data?.menu_json && data.menu_json.length > 0) {
      // Sem limite de idade: o app mostra há quanto tempo os dados foram obtidos.
      return {
        menu: data.menu_json as DayMenu[],
        source: "cache",
        fetchedAt: data.fetched_at,
        warning: "Site da UFPE indisponível. Exibindo último cardápio salvo.",
      };
    }
  } catch {
    // cache read failed
  }
  return null;
}

/**
 * Fetches the current UFPE restaurant menu.
 *
 * Calls the Supabase Edge Function `ufpe-menu`, which fetches the
 * UFPE restaurant page, parses the HTML tables, and returns
 * structured menu data.
 *
 * Fallback chain:
 * 1. Live data from edge function
 * 2. Cached data returned by edge function (when UFPE is down)
 * 3. Cached data read directly from Supabase (when edge function is unreachable)
 * 4. Last real menu saved on this device (works offline)
 * 5. Mock data (only if no real data has ever been obtained)
 *
 * This function NEVER throws — it always returns a FetchResult.
 */
export async function fetchUfpeMenu(): Promise<FetchResult> {
  try {
    const url = getEdgeFunctionUrl();
    const response = await fetchWithClientTimeout(url, CLIENT_FETCH_TIMEOUT_MS);

    if (!response.ok) {
      throw new Error(`Função retornou HTTP ${response.status}`);
    }

    const data: UfpeMenuResponse = await response.json();

    if (!data.success || !data.menu || data.menu.length === 0) {
      throw new Error(data.error || "Nenhum dado de cardápio retornado");
    }

    const fetchedAt = data.fetched_at ?? new Date().toISOString();
    saveLastRealMenu(data.menu, fetchedAt);

    return {
      menu: data.menu,
      source: data.source === "cache" ? "cache" : "live",
      fetchedAt,
      warning: data.warning,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Edge function failed — use the newest real data we can find:
    // Supabase cache or the copy saved on this device.
    const cached = await readCacheDirectly();
    const local = loadLastRealMenu();
    if (cached?.fetchedAt) saveLastRealMenu(cached.menu, cached.fetchedAt);
    if (cached && local) {
      return new Date(local.fetchedAt) > new Date(cached.fetchedAt ?? 0)
        ? {
            menu: local.menu,
            source: "cache",
            fetchedAt: local.fetchedAt,
            warning: "Sem conexão com o servidor. Exibindo o último cardápio salvo no aparelho.",
          }
        : cached;
    }
    if (cached) return cached;
    if (local) {
      return {
        menu: local.menu,
        source: "cache",
        fetchedAt: local.fetchedAt,
        warning: "Sem conexão com o servidor. Exibindo o último cardápio salvo no aparelho.",
      };
    }

    // No cache available — fall back to mock data
    return {
      menu: mockWeekMenu,
      source: "mock",
      warning:
        `Não foi possível buscar o cardápio ao vivo. Exibindo dados de demonstração. (${errorMsg})`,
    };
  }
}
