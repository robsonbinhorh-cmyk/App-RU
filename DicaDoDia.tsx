import { Lightbulb } from "lucide-react";

interface DicaDoDiaProps {
  text: string;
}

export function DicaDoDia({ text }: DicaDoDiaProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 p-5 shadow-md shadow-accent-500/20">
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/15" />
      <div className="absolute -bottom-6 -left-2 h-16 w-16 rounded-full bg-white/10" />
      <div className="relative flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/25 text-white">
          <Lightbulb size={20} fill="currentColor" />
        </span>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">Dica do dia</h3>
          <p className="mt-1 text-[15px] leading-snug text-white/95">{text}</p>
        </div>
      </div>
    </div>
  );
}
