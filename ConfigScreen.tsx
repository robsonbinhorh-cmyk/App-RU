import { Bell, BellRing, Info, Globe } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import {
  type NotificationPrefs,
  getPermissionState,
} from "@/hooks/useNotificationPrefs";

interface ToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function Toggle({ label, description, enabled, onToggle }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        className={`relative flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
          enabled ? "bg-primary-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

interface ConfigScreenProps {
  prefs: NotificationPrefs;
  onToggleNovoCardapio: () => void;
  onToggleDicaDoDia: () => void;
  onToggleCardapioDoDia: () => void;
}

export function ConfigScreen({ prefs, onToggleNovoCardapio, onToggleDicaDoDia, onToggleCardapioDoDia }: ConfigScreenProps) {
  const permission = getPermissionState();
  const denied = permission === "denied" || permission === "unsupported";

  return (
    <div className="min-h-screen pb-24">
      <AppHeader title="Configurações" subtitle="Personalize o app" />

      <main className="mx-auto max-w-md px-5 py-5">
        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Notificações
          </h2>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-50 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                {prefs.novoCardapio || prefs.dicaDoDia || prefs.cardapioDoDia ? <BellRing size={18} /> : <Bell size={18} />}
              </span>
              <p className="text-sm font-medium text-gray-700">Avisos do RU</p>
            </div>
            {denied && (prefs.novoCardapio || prefs.dicaDoDia || prefs.cardapioDoDia) && (
              <div className="border-b border-gray-50 bg-amber-50 px-4 py-3">
                <p className="text-xs text-amber-700">
                  {permission === "unsupported"
                    ? "Seu navegador não oferece suporte a notificações."
                    : "Permissão de notificações negada. Reabilite nas configurações do navegador para receber avisos."}
                </p>
              </div>
            )}
            <div className="divide-y divide-gray-50">
              <Toggle
                label="Cardápio do dia"
                description="Receber o prato principal do almoço todo dia às 08h"
                enabled={prefs.cardapioDoDia}
                onToggle={onToggleCardapioDoDia}
              />
              <Toggle
                label="Novo cardápio"
                description="Receber aviso quando o cardápio for atualizado"
                enabled={prefs.novoCardapio}
                onToggle={onToggleNovoCardapio}
              />
              <Toggle
                label="Dica do dia"
                description="Receber a dica diária do Restaurante Universitário"
                enabled={prefs.dicaDoDia}
                onToggle={onToggleDicaDoDia}
              />
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Sobre
          </h2>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-start gap-3 px-4 py-4">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <Info size={18} />
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">RU UFPE</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Aplicativo para consulta do cardápio do Restaurante Universitário da UFPE.
                  Os dados exibidos são fictícios e servem apenas para demonstração.
                </p>
              </div>
            </div>
            <a
              href="https://www.ufpe.br/restaurante"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 border-t border-gray-50 px-4 py-4 transition-colors hover:bg-gray-50"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <Globe size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Página oficial do RU</p>
                <p className="truncate text-xs text-gray-500">www.ufpe.br/restaurante</p>
              </div>
            </a>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-gray-400">Versão 1.0 — protótipo</p>
      </main>
    </div>
  );
}
