import { Link } from "@tanstack/react-router";
import { FilePlus2, ListChecks, Settings } from "lucide-react";

export function NavInferior({ mostrarConfig }: { mostrarConfig: boolean }) {
  const itens = [
    { to: "/novo" as const, rotulo: "Novo", Icone: FilePlus2 },
    { to: "/orcamentos" as const, rotulo: "Orçamentos", Icone: ListChecks },
    ...(mostrarConfig ? [{ to: "/config" as const, rotulo: "Config", Icone: Settings }] : []),
  ];
  return (
    <nav aria-label="Navegação principal" className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-xl">
        {itens.map(({ to, rotulo, Icone }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <Icone className="h-6 w-6" strokeWidth={1.6} />
              {rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
