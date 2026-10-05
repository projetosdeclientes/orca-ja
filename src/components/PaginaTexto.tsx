import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function PaginaTexto({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{titulo}</h1>
      <div className="space-y-4 text-sm leading-relaxed text-foreground [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold">{children}</div>
    </main>
  );
}
