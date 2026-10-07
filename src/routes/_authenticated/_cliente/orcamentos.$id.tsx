import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_cliente/orcamentos/$id")({
  head: () => ({ meta: [{ title: "Orçamento — OrçaJá" }] }),
  component: () => <p className="text-muted-foreground">Orçamento salvo.</p>,
});
