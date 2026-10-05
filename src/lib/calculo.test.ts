import { describe, expect, it } from "vitest";
import { calcularItem, calcularOrcamento, type ProdutoCalculo } from "./calculo";

const boxCorrer: ProdutoCalculo = { tipo_cobranca: "area", preco_base: 650, area_minima: 1.5, valor_minimo: 0 };
const espelho: ProdutoCalculo = { tipo_cobranca: "area", preco_base: 320, area_minima: 0.5, valor_minimo: 0 };
const incolor = { tipo_acrescimo: "fixo" as const, valor: 0 };
const branca = { tipo_acrescimo: "fixo" as const, valor: 0 };
const fume = { tipo_acrescimo: "por_m2" as const, valor: 60 };
const preta = { tipo_acrescimo: "fixo" as const, valor: 120 };

describe("motor de cálculo", () => {
  it("Box de correr 120x190 Incolor Branca = 1.482,00", () => {
    const r = calcularItem({ produto: boxCorrer, opcoes: [incolor, branca], largura_cm: 120, altura_cm: 190, quantidade: 1 });
    expect(r.area_m2).toBe(2.28);
    expect(r.valor_total).toBe(1482);
  });

  it("Box de correr 100x150 Fumê Preta = 1.185,00", () => {
    const r = calcularItem({ produto: boxCorrer, opcoes: [fume, preta], largura_cm: 100, altura_cm: 150, quantidade: 1 });
    expect(r.area_m2).toBe(1.5);
    expect(r.valor_base).toBe(975);
    expect(r.acrescimos).toBe(210);
    expect(r.valor_total).toBe(1185);
  });

  it("Espelho 40x50 abaixo do mínimo = 160,00", () => {
    const r = calcularItem({ produto: espelho, opcoes: [], largura_cm: 40, altura_cm: 50, quantidade: 1 });
    expect(r.area_m2).toBe(0.2);
    expect(r.valor_total).toBe(160);
  });

  it("pedido completo com instalação e 5% de desconto = 2.010,20", () => {
    const box = calcularItem({ produto: boxCorrer, opcoes: [incolor, branca], largura_cm: 120, altura_cm: 190, quantidade: 1 });
    const esp = calcularItem({ produto: espelho, opcoes: [], largura_cm: 80, altura_cm: 150, quantidade: 1 });
    expect(esp.valor_total).toBe(384);
    const o = calcularOrcamento([box.valor_total, esp.valor_total], [{ tipo: "fixo", valor: 250 }], { tipo: "percentual", valor: 5 });
    expect(o.subtotal).toBe(1866);
    expect(o.total_adicionais).toBe(250);
    expect(o.desconto_total).toBe(105.8);
    expect(o.total).toBe(2010.2);
  });

  it("valor mínimo, quantidade, linear, unidade e desconto nunca negativo", () => {
    const min = calcularItem({ produto: { tipo_cobranca: "unidade", preco_base: 10, area_minima: 0, valor_minimo: 50 }, opcoes: [], largura_cm: 0, altura_cm: 0, quantidade: 3 });
    expect(min.valor_unitario).toBe(50);
    expect(min.valor_total).toBe(150);
    const lin = calcularItem({ produto: { tipo_cobranca: "linear", preco_base: 100, area_minima: 0, valor_minimo: 0 }, opcoes: [{ tipo_acrescimo: "percentual", valor: 10 }], largura_cm: 250, altura_cm: 0, quantidade: 1 });
    expect(lin.valor_total).toBe(275);
    const o = calcularOrcamento([100], [], { tipo: "valor", valor: 500 });
    expect(o.total).toBe(0);
  });
});
