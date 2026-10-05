import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: () => <h1 className="text-2xl font-bold">Empresas</h1>,
});
