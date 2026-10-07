import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DocumentoOrcamento, type DocDados } from "@/components/DocumentoOrcamento";
import { hojeISO, linkWhatsApp, numeroOrcamento } from "@/lib/format";

export const Route = createFileRoute("/o/$token")({
  head: () => ({
    meta: [
      { title: "Orçamento — OrçaJá" },
      { name: "description", content: "Veja os detalhes do seu orçamento e aprove pelo WhatsApp." },
      { property: "og:title", content: "Seu orçamento" },
      { property: "og:description", content: "Veja os detalhes do seu orçamento e aprove pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaPublica,
});

type Dados = DocDados & { empresa: DocDados["empresa"] & { cor_primaria: string | null } };

function PaginaPublica() {
  const { token } = Route.useParams();
  const [d, setD] = useState<Dados | null | undefined>(undefined);

  useEffect(() => {
    let ativo = true;
    supabase.rpc("obter_orcamento_publico", { _token: token }).then(({ data, error }) => {
      if (!ativo) return;
      const r = data as unknown as Dados | null;
      if (error || !r || !r.orcamento) return setD(null);
      setD({ ...r, orcamento: { ...r.orcamento, adicionais_snapshot: Array.isArray(r.orcamento.adicionais_snapshot) ? r.orcamento.adicionais_snapshot : [] } });
    });
    return () => { ativo = false; };
  }, [token]);

  if (d === undefined) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando…</div>;
  if (d === null)
    return <div className="flex min-h-screen items-center justify-center p-6 text-center text-lg font-semibold text-foreground">Orçamento não encontrado</div>;

  const expirado = !!d.orcamento.validade_ate && d.orcamento.validade_ate < hojeISO();
  const cor = d.empresa.cor_primaria || undefined;
  const msg = `Olá! Quero aprovar o orçamento nº ${numeroOrcamento(d.orcamento.numero)}.`;

  return (
    <main className="min-h-screen bg-background px-4 py-6" style={cor ? ({ "--primary": cor } as React.CSSProperties) : undefined}>
      {expirado && (
        <div className="no-print mx-auto mb-4 max-w-2xl rounded-xl border border-warning/40 bg-warning/10 p-3 text-center text-sm font-medium text-foreground">
          Este orçamento expirou. Peça uma atualização à empresa.
        </div>
      )}
      <DocumentoOrcamento d={d} />
      <div className="no-print mx-auto mt-5 flex max-w-2xl flex-col gap-3">
        {d.empresa.whatsapp && (
          <a href={linkWhatsApp(d.empresa.whatsapp, msg)} target="_blank" rel="noopener noreferrer"
            className="flex h-14 items-center justify-center rounded-xl bg-success text-lg font-bold text-success-foreground">
            Aprovar pelo WhatsApp
          </a>
        )}
        <button type="button" onClick={() => window.print()}
          className="h-12 rounded-xl border border-border bg-card font-semibold text-foreground">
          Baixar PDF
        </button>
      </div>
    </main>
  );
}
