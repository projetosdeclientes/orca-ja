import type { ReactNode } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Carregando({ texto = "Carregando...", className }: { texto?: string; className?: string }) {
  return (
    <div role="status" className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground", className)}>
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <span className="text-sm">{texto}</span>
    </div>
  );
}

export interface VazioProps {
  icone: LucideIcon;
  titulo: string;
  texto?: string;
  acao?: ReactNode;
}

export function Vazio({ icone: Icone, titulo, texto, acao }: VazioProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
        <Icone className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <p className="font-semibold text-foreground">{titulo}</p>
      {texto && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{texto}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

export function Erro({ texto, onTentar }: { texto: string; onTentar?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
      <p className="text-sm font-medium text-destructive">{texto}</p>
      {onTentar && (
        <button onClick={onTentar} className="mt-3 text-sm font-semibold text-primary underline">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
