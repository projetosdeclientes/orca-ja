import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_cliente/novo")({
  head: () => ({ meta: [{ title: "Novo orçamento — OrçaJá" }] }),
  component: () => <p className="text-muted-foreground">Novo orçamento</p>,
});
