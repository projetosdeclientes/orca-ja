import { supabase } from "@/integrations/supabase/client";
import { calcularItem, calcularOrcamento, type ResultadoItem, type TipoAcrescimo, type TipoDesconto } from "./calculo";
import type { Adicional, Produto } from "./catalogo";
import { moeda, numero, data as fmtData, numeroOrcamento, linkWhatsApp, soDigitos } from "./format";

export interface OpcaoEscolhida { grupo_id: string; grupo_nome: string; opcao_id: string; nome: string; tipo_acrescimo: TipoAcrescimo; valor: number }
export interface ItemOrc {
  chave: string;
  produto_id: string;
  produto_nome: string;
  tipo_cobranca: Produto["tipo_cobranca"];
  opcoes: OpcaoEscolhida[];
  largura_cm: number;
  altura_cm: number;
  quantidade: number;
  resultado: ResultadoItem;
}

export interface Cliente { nome: string; telefone: string; endereco: string }

/** Monta um item a partir do produto e das opções escolhidas (preços ATUAIS). */
export function montarItem(p: Produto, selecao: Record<string, string>, largura: number, altura: number, quantidade: number, chave?: string): ItemOrc {
  const opcoes: OpcaoEscolhida[] = [];
  for (const g of p.grupos) {
    const o = g.opcoes.find((x) => x.id === selecao[g.id] && x.ativo);
    if (o) opcoes.push({ grupo_id: g.id, grupo_nome: g.nome, opcao_id: o.id, nome: o.nome, tipo_acrescimo: o.tipo_acrescimo, valor: Number(o.valor) });
  }
  const resultado = calcularItem({
    produto: { tipo_cobranca: p.tipo_cobranca, preco_base: Number(p.preco_base), area_minima: Number(p.area_minima), valor_minimo: Number(p.valor_minimo) },
    opcoes, largura_cm: largura, altura_cm: altura, quantidade,
  });
  return { chave: chave ?? crypto.randomUUID(), produto_id: p.id, produto_nome: p.nome, tipo_cobranca: p.tipo_cobranca, opcoes, largura_cm: largura, altura_cm: altura, quantidade, resultado };
}

/** Valida produto, opções obrigatórias e limites de medida. Retorna mensagem de erro ou null. */
export function validarItem(p: Produto | undefined, selecao: Record<string, string>, largura: number, altura: number): string | null {
  if (!p) return "Escolha um produto.";
  for (const g of p.grupos) if (g.obrigatorio && g.opcoes.some((o) => o.ativo) && !selecao[g.id]) return `Escolha: ${g.nome}.`;
  const pedeLargura = p.tipo_cobranca !== "unidade";
  const pedeAltura = p.tipo_cobranca === "area";
  if (pedeLargura && !(largura > 0)) return "Informe a largura.";
  if (pedeAltura && !(altura > 0)) return "Informe a altura.";
  if (pedeLargura && p.largura_min != null && largura < p.largura_min) return `Largura mínima: ${p.largura_min} cm.`;
  if (pedeLargura && p.largura_max != null && largura > p.largura_max) return `Largura máxima: ${p.largura_max} cm.`;
  if (pedeAltura && p.altura_min != null && altura < p.altura_min) return `Altura mínima: ${p.altura_min} cm.`;
  if (pedeAltura && p.altura_max != null && altura > p.altura_max) return `Altura máxima: ${p.altura_max} cm.`;
  return null;
}

export function descricaoItem(i: Pick<ItemOrc, "opcoes" | "largura_cm" | "altura_cm" | "tipo_cobranca">): string {
  const medida = i.tipo_cobranca === "area" ? `${numero(i.largura_cm, 1)}x${numero(i.altura_cm, 1)} cm` : i.tipo_cobranca === "linear" ? `${numero(i.largura_cm, 1)} cm` : "";
  return [medida, ...i.opcoes.map((o) => o.nome)].filter(Boolean).join(" · ");
}

export interface TotaisEntrada { itens: ItemOrc[]; adicionais: Adicional[]; marcados: string[]; desconto: { tipo: TipoDesconto; valor: number } }

export function calcularTotais({ itens, adicionais, marcados, desconto }: TotaisEntrada) {
  const escolhidos = adicionais.filter((a) => marcados.includes(a.id));
  const r = calcularOrcamento(itens.map((i) => i.resultado.valor_total), escolhidos.map((a) => ({ tipo: a.tipo, valor: Number(a.valor) })), desconto);
  const snapshot = escolhidos.map((a, k) => ({ nome: a.nome, tipo: a.tipo, valor: Number(a.valor), valor_calculado: r.adicionais[k] ?? 0 }));
  return { ...r, adicionais_snapshot: snapshot };
}

export interface SalvarEntrada extends TotaisEntrada { empresaId: string; cliente: Cliente; observacoes: string; validade_ate: string }

/** Grava orçamento + itens com SNAPSHOTS. Número e token são gerados no banco. */
export async function salvarOrcamento(e: SalvarEntrada): Promise<{ id: string; numero: number; token: string; total: number }> {
  const t = calcularTotais(e);
  const { data: orc, error } = await supabase
    .from("orcamentos")
    .insert({
      empresa_id: e.empresaId, cliente_nome: e.cliente.nome.trim(), cliente_telefone: soDigitos(e.cliente.telefone) || null,
      cliente_endereco: e.cliente.endereco.trim() || null, subtotal: t.subtotal, desconto_tipo: e.desconto.tipo,
      desconto_valor: e.desconto.valor, desconto_total: t.desconto_total, adicionais_snapshot: t.adicionais_snapshot,
      total: t.total, validade_ate: e.validade_ate, observacoes: e.observacoes.trim() || null,
    })
    .select("id, numero, token_publico")
    .single();
  if (error || !orc) throw new Error("Não foi possível salvar o orçamento.");
  const { error: ei } = await supabase.from("orcamento_itens").insert(
    e.itens.map((i, k) => ({
      orcamento_id: orc.id, produto_nome: i.produto_nome, descricao: descricaoItem(i), largura_cm: i.largura_cm || null,
      altura_cm: i.altura_cm || null, quantidade: i.quantidade, area_m2: i.resultado.area_m2, valor_unitario: i.resultado.valor_unitario,
      valor_total: i.resultado.valor_total, ordem: k,
      snapshot: { produto_id: i.produto_id, tipo_cobranca: i.tipo_cobranca, opcoes: i.opcoes, resultado: i.resultado } as never,
    })),
  );
  if (ei) throw new Error("O orçamento foi criado, mas houve erro ao salvar os itens.");
  return { id: orc.id, numero: orc.numero, token: orc.token_publico, total: t.total };
}

export function linkPublico(token: string): string {
  return `${window.location.origin}/o/${token}`;
}

export function mensagemCliente(p: { cliente: string; numero: number; empresa: string; total: number; validade: string; token: string }): string {
  return `Olá, ${p.cliente}! Segue seu orçamento nº ${numeroOrcamento(p.numero)} da ${p.empresa}. Total: ${moeda(p.total)}, válido até ${fmtData(p.validade)}. Veja os detalhes: ${linkPublico(p.token)}`;
}

export function linkWhatsCliente(telefone: string, mensagem: string): string {
  return linkWhatsApp(telefone, mensagem);
}
