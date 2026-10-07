/**
 * Motor de cálculo do OrçaJá. Função pura, sem dependências externas.
 * Segue exatamente as regras do conhecimento do projeto; arredonda a 2 casas a cada etapa.
 */

export type TipoCobranca = "area" | "linear" | "unidade";
export type TipoAcrescimo = "fixo" | "por_m2" | "percentual";
export type TipoAdicional = "fixo" | "percentual";
export type TipoDesconto = "valor" | "percentual";

export interface ProdutoCalculo {
  tipo_cobranca: TipoCobranca;
  preco_base: number;
  area_minima: number;
  valor_minimo: number;
}

export interface OpcaoCalculo {
  tipo_acrescimo: TipoAcrescimo;
  valor: number;
}

export interface EntradaItem {
  produto: ProdutoCalculo;
  opcoes: OpcaoCalculo[];
  largura_cm: number;
  altura_cm: number;
  quantidade: number;
}

export interface ResultadoItem {
  area_m2: number;
  valor_base: number;
  acrescimos: number;
  valor_unitario: number;
  valor_total: number;
}

export interface AdicionalCalculo {
  tipo: TipoAdicional;
  valor: number;
}

export interface ResultadoOrcamento {
  subtotal: number;
  adicionais: number[];
  total_adicionais: number;
  desconto_total: number;
  total: number;
}

/** Arredonda a 2 casas (meio para cima) */
export function r2(v: number): number {
  const n = Number.isFinite(v) ? v : 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function calcularItem(e: EntradaItem): ResultadoItem {
  const largura = num(e.largura_cm);
  const altura = num(e.altura_cm);
  const qtd = Math.max(1, Math.floor(num(e.quantidade)) || 1);
  const areaExata = (largura * altura) / 10000;
  const area_m2 = r2(areaExata); // só para exibição/gravação
  const areaCobrada = Math.max(areaExata, num(e.produto.area_minima));
  const preco = num(e.produto.preco_base);

  let valor_base: number;
  if (e.produto.tipo_cobranca === "area") valor_base = r2(preco * areaCobrada);
  else if (e.produto.tipo_cobranca === "linear") valor_base = r2(preco * (largura / 100));
  else valor_base = r2(preco);

  let acrescimos = 0;
  for (const o of e.opcoes) {
    const v = num(o.valor);
    if (o.tipo_acrescimo === "fixo") acrescimos = r2(acrescimos + v);
    else if (o.tipo_acrescimo === "por_m2") acrescimos = r2(acrescimos + r2(v * areaCobrada));
    else acrescimos = r2(acrescimos + r2((v / 100) * valor_base));
  }

  const valor_unitario = r2(Math.max(valor_base + acrescimos, num(e.produto.valor_minimo)));
  const valor_total = r2(valor_unitario * qtd);
  return { area_m2, valor_base, acrescimos, valor_unitario, valor_total };
}

export function calcularOrcamento(
  totaisItens: number[],
  adicionais: AdicionalCalculo[],
  desconto: { tipo: TipoDesconto; valor: number },
): ResultadoOrcamento {
  const subtotal = r2(totaisItens.reduce((s, v) => s + num(v), 0));
  const valoresAdic = adicionais.map((a) =>
    a.tipo === "fixo" ? r2(num(a.valor)) : r2((num(a.valor) / 100) * subtotal),
  );
  const total_adicionais = r2(valoresAdic.reduce((s, v) => s + v, 0));
  const baseDesconto = r2(subtotal + total_adicionais);
  const bruto = desconto.tipo === "percentual" ? r2((num(desconto.valor) / 100) * baseDesconto) : r2(num(desconto.valor));
  const desconto_total = r2(Math.min(bruto, baseDesconto));
  const total = r2(Math.max(0, baseDesconto - desconto_total));
  return { subtotal, adicionais: valoresAdic, total_adicionais, desconto_total, total };
}
