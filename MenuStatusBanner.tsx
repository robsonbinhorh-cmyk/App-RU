import { AlertCircle, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { formatAge } from "@/lib/menuStore";

interface MenuStatusBannerProps {
  source: "live" | "cache" | "mock";
  loading: boolean;
  error: string | null;
  warning: string | null;
  fetchedAt?: string | null;
  onRefetch: () => void;
}

export function MenuStatusBanner({
  source,
  loading,
  fetchedAt,
  onRefetch,
}: MenuStatusBannerProps) {
  const age = formatAge(fetchedAt ?? undefined);

  if (loading) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-2xl bg-primary-50 px-4 py-3">
        <Loader2 size={16} className="animate-spin text-primary-600" />
        <span className="text-sm text-primary-700">
          {age && source !== "mock"
            ? `Atualizando... (cardápio salvo ${age})`
            : "Carregando cardápio..."}
        </span>
      </div>
    );
  }

  // Dados de demonstração: nunca podem passar por cardápio oficial.
  if (source === "mock") {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-error-200 bg-error-50 px-4 py-3">
        <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-error-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-error-800">
            Dados de demonstração — não é o cardápio oficial.
          </p>
          <p className="mt-0.5 text-xs text-error-700">
            Não foi possível obter o cardápio da UFPE e ainda não há um cardápio salvo neste aparelho.
          </p>
        </div>
        <button
          onClick={onRefetch}
          className="flex-shrink-0 rounded-full bg-error-100 p-1.5 text-error-600 transition-colors hover:bg-error-200"
          aria-label="Tentar novamente"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    );
  }

  if (source === "live") {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-success-200 bg-success-50 px-4 py-2.5">
        <Wifi size={14} className="text-success-600" />
        <span className="text-xs font-medium text-success-700">
          Cardápio do site da UFPE{age ? ` — obtido ${age}` : ""}
        </span>
        <button
          onClick={onRefetch}
          disabled={loading}
          className="ml-auto flex-shrink-0 rounded-full p-1.5 text-success-600 transition-colors hover:bg-success-100 disabled:opacity-50"
          aria-label="Atualizar cardápio"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    );
  }

  // source === "cache": cardápio real salvo, não necessariamente recente.
  return (
    <div className="mb-4 flex items-center gap-2 rounded-2xl border border-warning-200 bg-warning-50 px-4 py-2.5">
      <WifiOff size={14} className="flex-shrink-0 text-warning-600" />
      <span className="text-xs font-medium text-warning-700">
        Último cardápio salvo{age ? ` (obtido ${age})` : ""}. Não foi possível atualizar agora.
      </span>
      <button
        onClick={onRefetch}
        disabled={loading}
        className="ml-auto flex-shrink-0 rounded-full p-1.5 text-warning-600 transition-colors hover:bg-warning-100 disabled:opacity-50"
        aria-label="Atualizar cardápio"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
      </button>
    </div>
  );
}
