import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_cliente/orcamentos/")({
  head: () => ({ meta: [{ title: "Orçamentos — OrçaJá" }] }),
  component: () => <p className="text-muted-foreground">Orçamentos</p>,
});
