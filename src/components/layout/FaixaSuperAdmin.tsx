import { useNavigate } from "@tanstack/react-router";
import { definirEmpresaAtiva } from "@/lib/empresa-ativa";

/** Faixa exibida quando o Super Admin está dentro da visão de uma empresa. */
export function FaixaSuperAdmin({ nome }: { nome: string }) {
  const navigate = useNavigate();
  return (
    <div className="no-print flex items-center justify-between gap-2 bg-warning px-4 py-2 text-sm text-warning-foreground">
      <span className="truncate">
        Você está vendo: <strong>{nome}</strong>
      </span>
      <button
        onClick={() => {
          definirEmpresaAtiva(null);
          navigate({ to: "/admin" });
        }}
        className="shrink-0 rounded-lg bg-card/20 px-3 py-1 font-semibold"
      >
        Voltar ao admin
      </button>
    </div>
  );
}
