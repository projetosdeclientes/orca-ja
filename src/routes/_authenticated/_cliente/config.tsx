import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useSessaoOk } from "@/lib/sessao";

export const Route = createFileRoute("/_authenticated/_cliente/config")({
  head: () => ({ meta: [{ title: "Configurações — OrçaJá" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const sessao = useSessaoOk();
  if (!sessao.podeConfigurar) return <Navigate to="/novo" />;
  return <p className="text-muted-foreground">Configurações</p>;
}
