import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TipoAcrescimo, TipoAdicional, TipoCobranca } from "./calculo";

export interface Opcao { id: string; grupo_id: string; nome: string; tipo_acrescimo: TipoAcrescimo; valor: number; ativo: boolean; ordem: number }
export interface Grupo { id: string; produto_id: string; nome: string; obrigatorio: boolean; ordem: number; opcoes: Opcao[] }
export interface Produto {
  id: string; empresa_id: string; nome: string; categoria: string | null; tipo_cobranca: TipoCobranca;
  preco_base: number; area_minima: number; valor_minimo: number;
  largura_min: number | null; largura_max: number | null; altura_min: number | null; altura_max: number | null;
  ativo: boolean; ordem: number; grupos: Grupo[];
}
export interface Adicional { id: string; empresa_id: string; nome: string; tipo: TipoAdicional; valor: number; marcado_por_padrao: boolean; ativo: boolean; ordem: number }

const porOrdem = <T extends { ordem: number }>(a: T, b: T) => a.ordem - b.ordem;

export async function carregarCatalogo(empresaId: string): Promise<Produto[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("*, grupos_opcao(*, opcoes(*))")
    .eq("empresa_id", empresaId)
    .order("ordem")
    .order("created_at");
  if (error) throw new Error("Não foi possível carregar os produtos.");
  return (data ?? []).map((p) => {
    const { grupos_opcao, ...resto } = p as typeof p & { grupos_opcao: (Omit<Grupo, "opcoes"> & { opcoes: Opcao[] })[] };
    return {
      ...(resto as unknown as Omit<Produto, "grupos">),
      grupos: (grupos_opcao ?? []).sort(porOrdem).map((g) => ({ ...g, opcoes: (g.opcoes ?? []).sort(porOrdem) })),
    };
  });
}

export async function carregarAdicionais(empresaId: string): Promise<Adicional[]> {
  const { data, error } = await supabase.from("adicionais").select("*").eq("empresa_id", empresaId).order("ordem").order("created_at");
  if (error) throw new Error("Não foi possível carregar os adicionais.");
  return (data ?? []) as Adicional[];
}

export function useCatalogo(empresaId: string) {
  return useQuery({ queryKey: ["catalogo", empresaId], queryFn: () => carregarCatalogo(empresaId), staleTime: 30_000 });
}
export function useAdicionais(empresaId: string) {
  return useQuery({ queryKey: ["adicionais", empresaId], queryFn: () => carregarAdicionais(empresaId), staleTime: 30_000 });
}
export function useRecarregarCatalogo(empresaId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["catalogo", empresaId] });
    qc.invalidateQueries({ queryKey: ["adicionais", empresaId] });
  };
}

export const ROTULO_COBRANCA: Record<TipoCobranca, string> = { area: "por m²", linear: "por metro", unidade: "por unidade" };

/** Duplica um produto com grupos e opções. */
export async function duplicarProduto(p: Produto): Promise<void> {
  const { grupos, id: _id, ...dados } = p;
  void _id;
  const { data: novo, error } = await supabase.from("produtos").insert({ ...dados, nome: `${p.nome} (cópia)`, ordem: p.ordem + 1 }).select("id").single();
  if (error || !novo) throw new Error("Não foi possível duplicar.");
  for (const g of grupos) {
    const { data: ng, error: eg } = await supabase.from("grupos_opcao").insert({ produto_id: novo.id, nome: g.nome, obrigatorio: g.obrigatorio, ordem: g.ordem }).select("id").single();
    if (eg || !ng) throw new Error("Erro ao duplicar grupos.");
    if (g.opcoes.length)
      await supabase.from("opcoes").insert(g.opcoes.map((o) => ({ grupo_id: ng.id, nome: o.nome, tipo_acrescimo: o.tipo_acrescimo, valor: o.valor, ativo: o.ativo, ordem: o.ordem })));
  }
}

/** Troca a ordem de dois registros vizinhos. */
export async function trocarOrdem(tabela: "grupos_opcao" | "opcoes", a: { id: string; ordem: number }, b: { id: string; ordem: number }, ia: number, ib: number) {
  await supabase.from(tabela).update({ ordem: ib }).eq("id", a.id);
  await supabase.from(tabela).update({ ordem: ia }).eq("id", b.id);
}
