import { data as fmtData, mascaraTelefone, moeda, numeroOrcamento } from "@/lib/format";

export interface DocItem { produto_nome: string; descricao: string | null; quantidade: number; valor_total: number }
export interface DocAdicional { nome: string; valor_calculado: number }
export interface DocDados {
  orcamento: {
    numero: number; cliente_nome: string; subtotal: number; desconto_total: number;
    adicionais_snapshot: DocAdicional[]; total: number; validade_ate: string | null; observacoes: string | null; created_at: string;
  };
  itens: DocItem[];
  empresa: { nome: string; logo_url: string | null; whatsapp: string | null; endereco: string | null; texto_topo: string | null; condicoes_pagamento: string | null; prazo_entrega_padrao: string | null };
}

/** Documento do orçamento como o cliente vê (página pública, prévia e impressão). */
export function DocumentoOrcamento({ d }: { d: DocDados }) {
  const { orcamento: o, empresa: e } = d;
  return (
    <article className="print-doc mx-auto w-full max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
      <header className="text-center">
        {e.logo_url && <img src={e.logo_url} alt={e.nome} className="mx-auto mb-2 h-16 max-w-[180px] object-contain" />}
        <p className="text-lg font-bold text-foreground">{e.nome}</p>
        {e.texto_topo && <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{e.texto_topo}</p>}
      </header>
      <div className="border-y border-border py-3 text-center">
        <p className="text-sm font-bold tracking-wide text-primary">ORÇAMENTO Nº {numeroOrcamento(o.numero)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Para: <strong className="text-foreground">{o.cliente_nome}</strong> · Data: {fmtData(o.created_at)}
          {o.validade_ate && <> · Válido até: {fmtData(o.validade_ate)}</>}
        </p>
      </div>
      <ul className="divide-y divide-border">
        {d.itens.map((i, k) => (
          <li key={`${i.produto_nome}-${k}`} className="flex justify-between gap-3 py-3">
            <div>
              <p className="font-medium text-foreground">{i.quantidade}× {i.produto_nome}</p>
              {i.descricao && <p className="text-sm text-muted-foreground">{i.descricao}</p>}
            </div>
            <p className="shrink-0 font-semibold text-foreground">{moeda(i.valor_total)}</p>
          </li>
        ))}
      </ul>
      <div className="space-y-1 text-sm">
        <Linha r="Subtotal" v={moeda(o.subtotal)} />
        {o.adicionais_snapshot.map((a) => <Linha key={a.nome} r={a.nome} v={moeda(a.valor_calculado)} />)}
        {Number(o.desconto_total) > 0 && <Linha r="Desconto" v={`− ${moeda(o.desconto_total)}`} />}
      </div>
      <div className="flex items-center justify-between rounded-xl bg-primary-soft p-4">
        <span className="font-semibold text-foreground">TOTAL</span>
        <span className="text-2xl font-extrabold text-primary">{moeda(o.total)}</span>
      </div>
      {o.observacoes && <p className="whitespace-pre-line text-sm text-muted-foreground"><strong className="text-foreground">Observações:</strong> {o.observacoes}</p>}
      {(e.condicoes_pagamento || e.prazo_entrega_padrao) && (
        <div className="space-y-1 rounded-xl border border-border p-4 text-sm">
          {e.condicoes_pagamento && <p><strong>Condições:</strong> {e.condicoes_pagamento}</p>}
          {e.prazo_entrega_padrao && <p><strong>Prazo de entrega:</strong> {e.prazo_entrega_padrao}</p>}
        </div>
      )}
      {(e.endereco || e.whatsapp) && (
        <footer className="border-t border-border pt-3 text-center text-xs text-muted-foreground">
          {e.endereco && <p>{e.endereco}</p>}
          {e.whatsapp && <p>WhatsApp: {mascaraTelefone(e.whatsapp)}</p>}
        </footer>
      )}
    </article>
  );
}

function Linha({ r, v }: { r: string; v: string }) {
  return <div className="flex justify-between text-muted-foreground"><span>{r}</span><span className="text-foreground">{v}</span></div>;
}
