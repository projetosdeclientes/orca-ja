import { useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Empresa } from "@/lib/sessao";
import { definirEmpresaAtiva } from "@/lib/empresa-ativa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CabecalhoProps {
  empresa: Pick<Empresa, "nome" | "logo_url">;
  isSuper: boolean;
}

export function Cabecalho({ empresa, isSuper }: CabecalhoProps) {
  const navigate = useNavigate();
  return (
    <header className="no-print sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-4">
        {empresa.logo_url ? (
          <img src={empresa.logo_url} alt="" className="h-9 w-9 rounded-lg object-contain" />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {empresa.nome.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="flex-1 truncate font-semibold text-foreground">{empresa.nome}</span>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Menu" className="grid h-10 w-10 place-items-center rounded-xl text-foreground hover:bg-muted">
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isSuper && (
              <DropdownMenuItem
                onClick={() => {
                  definirEmpresaAtiva(null);
                  navigate({ to: "/admin" });
                }}
              >
                <Shield className="mr-2 h-4 w-4" /> Voltar ao admin
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/login" }))}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
