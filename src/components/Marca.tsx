import { Ruler } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MarcaProps {
  className?: string;
  clara?: boolean;
}

/** Marca OrçaJá (ícone + nome). */
export function Marca({ className, clara }: MarcaProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Ruler className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className={cn("text-2xl font-extrabold tracking-tight", clara ? "text-sidebar-foreground" : "text-foreground")}>
        Orça<span className="text-primary">Já</span>
      </span>
    </div>
  );
}
