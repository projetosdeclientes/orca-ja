import { supabase } from "@/integrations/supabase/client";
import type { TipoAcrescimo, TipoAdicional, TipoCobranca } from "./calculo";

/** Modelos fixos de catálogo usados ao criar empresas (único lugar). */
export interface ModeloOpcao { nome: string; tipo_acrescimo: TipoAcrescimo; valor: number }
export interface ModeloGrupo { nome: string; obrigatorio: boolean; opcoes: ModeloOpcao[] }
export interface ModeloProduto {
  nome: string;
  categoria?: string;
  tipo_cobranca: TipoCobranca;
  preco_base: number;
  area_minima: number;
  valor_minimo?: number;
  largura_min?: number;
  largura_max?: number;
  altura_min?: number;
  altura_max?: number;
  grupos: ModeloGrupo[];
}
export interface ModeloAdicional { nome: string; tipo: TipoAdicional; valor: number; marcado_por_padrao: boolean }
export interface Modelo {
  rotulo: string;
  condicoes_pagamento: string;
  prazo_entrega_padrao: string;
  validade_dias: number;
  produtos: ModeloProduto[];
  adicionais: ModeloAdicional[];
}

const vidro: ModeloGrupo = {
  nome: "Vidro",
  obrigatorio: true,
  opcoes: [
    { nome: "Incolor 8mm", tipo_acrescimo: "fixo", valor: 0 },
    { nome: "Fumê 8mm", tipo_acrescimo: "por_m2", valor: 60 },
    { nome: "Verde 8mm", tipo_acrescimo: "por_m2", valor: 60 },
  ],
};
const ferragem: ModeloGrupo = {
  nome: "Ferragem",
  obrigatorio: true,
  opcoes: [
    { nome: "Branca", tipo_acrescimo: "fixo", valor: 0 },
    { nome: "Preta", tipo_acrescimo: "fixo", valor: 120 },
  ],
};
const medidasBox = { largura_min: 40, largura_max: 400, altura_min: 40, altura_max: 300 };

export const MODELOS = {
  vidracaria: {
    rotulo: "Modelo Vidraçaria / Box",
    condicoes_pagamento: "50% de entrada e 50% na instalação",
    prazo_entrega_padrao: "10 dias úteis",
    validade_dias: 7,
    produtos: [
      { nome: "Box de correr", categoria: "Box", tipo_cobranca: "area", preco_base: 650, area_minima: 1.5, ...medidasBox, grupos: [vidro, ferragem] },
      { nome: "Box de abrir", categoria: "Box", tipo_cobranca: "area", preco_base: 580, area_minima: 1.2, ...medidasBox, grupos: [vidro, ferragem] },
      {
        nome: "Espelho", categoria: "Espelhos", tipo_cobranca: "area", preco_base: 320, area_minima: 0.5,
        grupos: [{ nome: "Acabamento", obrigatorio: true, opcoes: [{ nome: "Liso", tipo_acrescimo: "fixo", valor: 0 }, { nome: "Bisotê", tipo_acrescimo: "por_m2", valor: 45 }] }],
      },
    ],
    adicionais: [
      { nome: "Instalação", tipo: "fixo", valor: 250, marcado_por_padrao: true },
      { nome: "Frete", tipo: "fixo", valor: 80, marcado_por_padrao: false },
    ],
  },
  cortinas: {
    rotulo: "Modelo Cortinas e Persianas",
    condicoes_pagamento: "50% de entrada e 50% na instalação",
    prazo_entrega_padrao: "15 dias úteis",
    validade_dias: 7,
    produtos: [
      {
        nome: "Cortina rolô", categoria: "Cortinas", tipo_cobranca: "area", preco_base: 180, area_minima: 1,
        largura_min: 30, largura_max: 300, altura_min: 30, altura_max: 350,
        grupos: [{ nome: "Tecido", obrigatorio: true, opcoes: [{ nome: "Screen 5%", tipo_acrescimo: "fixo", valor: 0 }, { nome: "Blackout", tipo_acrescimo: "por_m2", valor: 40 }] }],
      },
      {
        nome: "Persiana horizontal", categoria: "Persianas", tipo_cobranca: "area", preco_base: 150, area_minima: 1,
        largura_min: 30, largura_max: 250, altura_min: 30, altura_max: 300,
        grupos: [{ nome: "Lâmina", obrigatorio: true, opcoes: [{ nome: "Alumínio 25mm", tipo_acrescimo: "fixo", valor: 0 }, { nome: "Madeira 50mm", tipo_acrescimo: "percentual", valor: 30 }] }],
      },
    ],
    adicionais: [{ nome: "Instalação", tipo: "fixo", valor: 120, marcado_por_padrao: true }],
  },
} satisfies Record<string, Modelo>;

export type ChaveModelo = keyof typeof MODELOS;

/** Insere o catálogo do modelo na empresa (requer dono ou super admin). */
export async function aplicarModelo(empresaId: string, modelo: Modelo): Promise<void> {
  await supabase
    .from("empresas")
    .update({ condicoes_pagamento: modelo.condicoes_pagamento, prazo_entrega_padrao: modelo.prazo_entrega_padrao, validade_dias: modelo.validade_dias })
    .eq("id", empresaId);
  for (const [i, p] of modelo.produtos.entries()) {
    const { grupos, ...dados } = p;
    const { data: prod, error } = await supabase.from("produtos").insert({ ...dados, empresa_id: empresaId, ordem: i }).select("id").single();
    if (error || !prod) throw new Error("Erro ao aplicar o modelo (produtos).");
    for (const [j, g] of grupos.entries()) {
      const { data: grp, error: eg } = await supabase.from("grupos_opcao").insert({ produto_id: prod.id, nome: g.nome, obrigatorio: g.obrigatorio, ordem: j }).select("id").single();
      if (eg || !grp) throw new Error("Erro ao aplicar o modelo (grupos).");
      const { error: eo } = await supabase.from("opcoes").insert(g.opcoes.map((o, k) => ({ ...o, grupo_id: grp.id, ordem: k })));
      if (eo) throw new Error("Erro ao aplicar o modelo (opções).");
    }
  }
  const { error: ea } = await supabase.from("adicionais").insert(modelo.adicionais.map((a, i) => ({ ...a, empresa_id: empresaId, ordem: i })));
  if (ea) throw new Error("Erro ao aplicar o modelo (adicionais).");
}
