import { useEffect, useState, useCallback, useRef } from "react";
import type { DayMenu, MealName } from "@/types";
import { fetchUfpeMenu, type FetchResult } from "@/lib/menuService";
import { weekMenu as mockWeekMenu } from "@/data/menuData";
import { getRecommendationText } from "@/lib/recommendations";
import { getTodayMenu, getTodayIndex } from "@/data/menuData";
import { sendNotification } from "@/lib/notifications";
import { menuSignature, todayKey } from "@/lib/menuSignature";
import { loadLastRealMenu } from "@/lib/menuStore";
import type { NotificationPrefs } from "@/hooks/useNotificationPrefs";

const HOOK_SAFETY_TIMEOUT_MS = 20000;
const AUTO_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

interface UseMenuState {
  menu: DayMenu[];
  source: "live" | "cache" | "mock";
  loading: boolean;
  error: string | null;
  warning: string | null;
  fetchedAt: string | null;
  refetch: () => void;
}

// Cardápio real guardado no aparelho: aparece na hora ao abrir o app,
// mesmo offline, enquanto a atualização acontece em segundo plano.
function initialStoredResult(): FetchResult | null {
  const stored = loadLastRealMenu();
  if (!stored) return null;
  return { menu: stored.menu, source: "cache", fetchedAt: stored.fetchedAt };
}

interface UseMenuOptions {
  prefs?: NotificationPrefs;
  selectedMeal?: MealName;
}

export function useMenu(options: UseMenuOptions = {}): UseMenuState {
  const { prefs, selectedMeal } = options;
  const [initialResult] = useState<FetchResult | null>(initialStoredResult);
  const [result, setResult] = useState<FetchResult | null>(initialResult);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Preserve the last successful real (live or cache) menu across refetches.
  const lastRealResult = useRef<FetchResult | null>(initialResult);

  // Prevents concurrent/duplicate refresh requests.
  const loadingRef = useRef(false);

  // Track the last menu signature we've seen, so we only notify on genuine changes.
  const lastMenuSignature = useRef<string | null>(null);

  // Track the last date we sent a dica-do-dia notification, to prevent duplicates.
  const lastDicaDate = useRef<string | null>(null);

  // Keep prefs and selectedMeal in refs so the effect doesn't re-run on every change.
  const prefsRef = useRef(prefs);
  const selectedMealRef = useRef(selectedMeal);
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);
  useEffect(() => {
    selectedMealRef.current = selectedMeal;
  }, [selectedMeal]);

  const refetch = useCallback(() => {
    setRefetchTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let safetyTimer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      if (loadingRef.current) return;
      loadingRef.current = true;

      setLoading(true);
      setError(null);

      safetyTimer = setTimeout(() => {
        if (!cancelled) {
          console.warn("[useMenu] Safety timeout — forcing fallback");
          if (lastRealResult.current) {
            setResult({
              ...lastRealResult.current,
              warning: "Tempo limite excedido. Exibindo último cardápio salvo.",
            });
          } else {
            setResult({
              menu: mockWeekMenu,
              source: "mock",
              warning: "Tempo limite excedido. Exibindo dados de demonstração.",
            });
          }
          setLoading(false);
          loadingRef.current = false;
        }
      }, HOOK_SAFETY_TIMEOUT_MS);

      try {
        const res = await fetchUfpeMenu();
        if (cancelled) return;

        if (res.source === "live" || res.source === "cache") {
          lastRealResult.current = res;
          setResult(res);
        } else {
          if (lastRealResult.current) {
            setResult({
              ...lastRealResult.current,
              warning:
                "Site da UFPE indisponível no momento. Exibindo último cardápio salvo.",
            });
          } else {
            setResult(res);
          }
        }

        // ── Notification logic ──
        const currentPrefs = prefsRef.current;

        if (res.source === "live" || res.source === "cache") {
          const sig = menuSignature(res.menu);

          // "Novo cardápio": only for genuinely changed live menus.
          // Cache reloads of the same data and mock data are ignored.
          if (
            currentPrefs?.novoCardapio &&
            res.source === "live" &&
            lastMenuSignature.current !== null &&
            sig !== lastMenuSignature.current
          ) {
            sendNotification(
              "Novo cardápio disponível",
              "O cardápio do Restaurante Universitário foi atualizado. Toque para conferir."
            );
          }

          // Always update the signature when we get real data.
          lastMenuSignature.current = sig;

          // "Dica do dia": based on the currently selected meal.
          // Only once per day to prevent duplicates on repeated refreshes.
          if (currentPrefs?.dicaDoDia) {
            const dateKey = todayKey();
            if (lastDicaDate.current !== dateKey) {
              const meal = selectedMealRef.current ?? "Almoço";
              const todayIdx = getTodayIndex();
              const dayMenu = res.menu[todayIdx] ?? getTodayMenu();
              const categories = dayMenu.meals[meal] ?? [];
              const dicaText = getRecommendationText(categories);
              lastDicaDate.current = dateKey;
              sendNotification("Dica do dia", dicaText);
            }
          }
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        if (lastRealResult.current) {
          setResult({
            ...lastRealResult.current,
            warning: "Erro de conexão. Exibindo último cardápio salvo.",
          });
        } else {
          setResult({
            menu: mockWeekMenu,
            source: "mock",
            warning: "Erro inesperado. Exibindo dados de demonstração.",
          });
        }
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }

    load();

    return () => {
      cancelled = true;
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [refetchTrigger]);

  // Auto-refresh when the app returns to the foreground.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        setRefetchTrigger((n) => n + 1);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Auto-refresh every 30 minutes while the app is open.
  useEffect(() => {
    const interval = setInterval(() => {
      setRefetchTrigger((n) => n + 1);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return {
    menu: result?.menu ?? [],
    source: result?.source ?? "mock",
    loading,
    error,
    warning: result?.warning ?? null,
    fetchedAt: result?.fetchedAt ?? null,
    refetch,
  };
}
