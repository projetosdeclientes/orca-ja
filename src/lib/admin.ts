import { supabase } from "@/integrations/supabase/client";
import { EMPRESA_COLS, type Empresa } from "./sessao";
import { slugify } from "./format";

export interface EmpresaAdmin {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  cor_primaria: string;
  whatsapp: string | null;
  ativo: boolean;
  pago_ate: string | null;
  observacoes_admin: string | null;
  created_at: string;
  orcamentos_30d: number;
}

export async function listarEmpresasAdmin(): Promise<EmpresaAdmin[]> {
  const { data, error } = await supabase.rpc("admin_listar_empresas");
  if (error) throw new Error("Não foi possível carregar as empresas.");
  return (data ?? []) as EmpresaAdmin[];
}

export function slugUnico(nome: string): string {
  return `${slugify(nome) || "empresa"}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Dias de atraso (positivo) se pago_ate < hoje; senão 0. */
export function diasVencida(pagoAte: string | null): number {
  if (!pagoAte) return 0;
  const [a, m, d] = pagoAte.split("-").map(Number);
  const venc = new Date(a, m - 1, d).getTime();
  const hoje = new Date();
  const h = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  return h > venc ? Math.round((h - venc) / 86_400_000) : 0;
}

/** Duplica empresa (identidade + catálogo), sem orçamentos e sem usuários. */
export async function clonarEmpresa(origemId: string, novoNome: string): Promise<string> {
  const { data: origem, error } = await supabase.from("empresas").select(EMPRESA_COLS).eq("id", origemId).single();
  if (error || !origem) throw new Error("Empresa de origem não encontrada.");
  const o = origem as Empresa;
  const { data: nova, error: e2 } = await supabase
    .from("empresas")
    .insert({
      nome: novoNome.trim(),
      slug: slugUnico(novoNome),
      logo_url: o.logo_url,
      cor_primaria: o.cor_primaria,
      whatsapp: o.whatsapp,
      endereco: o.endereco,
      texto_topo: o.texto_topo,
      condicoes_pagamento: o.condicoes_pagamento,
      prazo_entrega_padrao: o.prazo_entrega_padrao,
      validade_dias: o.validade_dias,
      pago_ate: o.pago_ate,
    })
    .select("id")
    .single();
  if (e2 || !nova) throw new Error("Não foi possível criar a cópia.");
  const { error: e3 } = await supabase.rpc("admin_copiar_catalogo", { _origem: origemId, _destino: nova.id });
  if (e3) throw new Error("Empresa criada, mas houve erro ao copiar os produtos.");
  return nova.id;
}

export async function alterarAtivo(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from("empresas").update({ ativo }).eq("id", id);
  if (error) throw new Error("Não foi possível alterar o status.");
}
