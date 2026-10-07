import { useMemo, useState } from "react";
import { Minus, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Produto } from "@/lib/catalogo";
import { descricaoItem, montarItem, validarItem, type ItemOrc } from "@/lib/orcamento";
import { moeda, numero, paraCampo, parseDecimal } from "@/lib/format";
import { Vazio } from "@/components/Estados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props { produtos: Produto[]; itens: ItemOrc[]; onChange: (itens: ItemOrc[]) => void }

const VAZIO = { produtoId: "", selecao: {} as Record<string, string>, largura: "", altura: "", qtd: 1, chave: undefined as string | undefined };

export function PassoItens({ produtos, itens, onChange }: Props) {
  const ativos = produtos.filter((p) => p.ativo);
  const [f, setF] = useState(VAZIO);
  const produto = ativos.find((p) => p.id === f.produtoId);
  const l = parseDecimal(f.largura) || 0;
  const a = parseDecimal(f.altura) || 0;
  const previa = useMemo(() => (produto ? montarItem(produto, f.selecao, l, a, f.qtd) : null), [produto, f.selecao, l, a, f.qtd]);

  function escolherProduto(id: string) {
    const p = ativos.find((x) => x.id === id);
    const sel: Record<string, string> = {};
    p?.grupos.forEach((g) => { const o = g.opcoes.find((x) => x.ativo); if (o && g.obrigatorio) sel[g.id] = o.id; });
    setF({ ...f, produtoId: id, selecao: sel });
  }

  function adicionar() {
    const erro = validarItem(produto, f.selecao, l, a);
    if (erro || !produto) { toast.error(erro ?? "Escolha um produto."); return; }
    const novo = montarItem(produto, f.selecao, l, a, f.qtd, f.chave);
    onChange(f.chave ? itens.map((i) => (i.chave === f.chave ? novo : i)) : [...itens, novo]);
    setF({ ...VAZIO });
  }

  function editar(i: ItemOrc) {
    setF({ produtoId: i.produto_id, selecao: Object.fromEntries(i.opcoes.map((o) => [o.grupo_id, o.opcao_id])), largura: paraCampo(i.largura_cm || ""), altura: paraCampo(i.altura_cm || ""), qtd: i.quantidade, chave: i.chave });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (ativos.length === 0) return <Vazio icone={Package} titulo="Nenhum produto ativo" texto="Cadastre produtos em Config > Produtos." />;
  const c = "h-12 rounded-xl text-base";
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Produto</Label>
        <Select value={f.produtoId} onValueChange={escolherProduto}>
          <SelectTrigger className={c} aria-label="Produto"><SelectValue placeholder="Escolha o produto" /></SelectTrigger>
          <SelectContent>{ativos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {produto?.grupos.filter((g) => g.opcoes.some((o) => o.ativo)).map((g) => (
        <div key={g.id} className="space-y-2">
          <Label>{g.nome}{g.obrigatorio ? "" : " (opcional)"}</Label>
          <Select value={f.selecao[g.id] ?? ""} onValueChange={(v) => setF({ ...f, selecao: { ...f.selecao, [g.id]: v } })}>
            <SelectTrigger className={c} aria-label={g.nome}><SelectValue placeholder="Escolha" /></SelectTrigger>
            <SelectContent>{g.opcoes.filter((o) => o.ativo).map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      ))}
      {produto && produto.tipo_cobranca !== "unidade" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label htmlFor="i-l">Largura (cm)</Label><Input id="i-l" className={c} inputMode="decimal" value={f.largura} onChange={(e) => setF({ ...f, largura: e.target.value })} /></div>
          {produto.tipo_cobranca === "area" && <div className="space-y-2"><Label htmlFor="i-a">Altura (cm)</Label><Input id="i-a" className={c} inputMode="decimal" value={f.altura} onChange={(e) => setF({ ...f, altura: e.target.value })} /></div>}
        </div>
      )}
      <div className="flex items-center justify-between">
        <Label>Quantidade</Label>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-xl" aria-label="Diminuir" onClick={() => setF({ ...f, qtd: Math.max(1, f.qtd - 1) })}><Minus className="h-4 w-4" /></Button>
          <span className="w-8 text-center text-lg font-semibold">{f.qtd}</span>
          <Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-xl" aria-label="Aumentar" onClick={() => setF({ ...f, qtd: f.qtd + 1 })}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="rounded-2xl bg-primary-soft p-5" aria-live="polite">
        {produto?.tipo_cobranca === "area" && <p className="text-sm text-muted-foreground">Área: {numero(previa?.resultado.area_m2 ?? 0)} m²</p>}
        <p className="mt-1 text-xs font-semibold tracking-wide text-muted-foreground">VALOR DO ITEM</p>
        <p className="text-4xl font-extrabold text-primary">{moeda(previa?.resultado.valor_total ?? 0)}</p>
      </div>
      <Button type="button" variant="outline" className="h-12 w-full rounded-xl border-primary text-base text-primary" onClick={adicionar}>
        {f.chave ? "Salvar alteração do item" : "+ Adicionar este item"}
      </Button>
      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">Itens do orçamento ({itens.length})</h2>
        {itens.map((i) => (
          <div key={i.chave} className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{i.quantidade}× {i.produto_nome}</p>
              <p className="truncate text-xs text-muted-foreground">{descricaoItem(i)}</p>
            </div>
            <span className="text-sm font-semibold">{moeda(i.resultado.valor_total)}</span>
            <Button variant="ghost" size="icon" aria-label="Editar item" onClick={() => editar(i)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label="Remover item" onClick={() => onChange(itens.filter((x) => x.chave !== i.chave))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </section>
    </div>
  );
}
