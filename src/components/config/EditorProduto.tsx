import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRecarregarCatalogo, type Produto } from "@/lib/catalogo";
import type { TipoCobranca } from "@/lib/calculo";
import { paraCampo, parseDecimal } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GruposOpcoes } from "./GruposOpcoes";

export interface EditorProdutoProps {
  empresaId: string;
  produto: Produto | null;
  ordem: number;
  onCriado: (id: string) => void;
  onFechar: () => void;
}

const COBRANCAS: { v: TipoCobranca; rotulo: string; ajuda: string }[] = [
  { v: "area", rotulo: "Por m²", ajuda: "Largura x altura. Ex.: box, vidro, cortina." },
  { v: "linear", rotulo: "Por metro linear", ajuda: "Só a largura. Ex.: rodapé, bancada." },
  { v: "unidade", rotulo: "Por unidade", ajuda: "Preço fixo por peça. Ex.: puxador." },
];

export function EditorProduto({ empresaId, produto, ordem, onCriado, onFechar }: EditorProdutoProps) {
  const recarregar = useRecarregarCatalogo(empresaId);
  const [salvando, setSalvando] = useState(false);
  const [f, setF] = useState({
    nome: produto?.nome ?? "", tipo_cobranca: (produto?.tipo_cobranca ?? "area") as TipoCobranca,
    preco_base: paraCampo(produto?.preco_base), area_minima: paraCampo(produto?.area_minima), valor_minimo: paraCampo(produto?.valor_minimo),
    largura_min: paraCampo(produto?.largura_min), largura_max: paraCampo(produto?.largura_max),
    altura_min: paraCampo(produto?.altura_min), altura_max: paraCampo(produto?.altura_max),
  });

  /** Converte texto em número >= 0; vazio = valor padrão. Retorna null se inválido. */
  function n(txt: string, padrao: number | null): number | null | "erro" {
    if (!txt.trim()) return padrao;
    const v = parseDecimal(txt);
    return Number.isNaN(v) || v < 0 ? "erro" : v;
  }

  async function salvar() {
    if (f.nome.trim().length < 2) { toast.error("Informe o nome do produto."); return; }
    const vals = {
      preco_base: n(f.preco_base, null), area_minima: n(f.area_minima, 0), valor_minimo: n(f.valor_minimo, 0),
      largura_min: n(f.largura_min, null), largura_max: n(f.largura_max, null), altura_min: n(f.altura_min, null), altura_max: n(f.altura_max, null),
    };
    if (vals.preco_base === null) { toast.error("Informe o preço base."); return; }
    if (Object.values(vals).includes("erro")) { toast.error("Use apenas números positivos (ex.: 650,00)."); return; }
    const v = vals as Record<keyof typeof vals, number | null>;
    if ((v.largura_min ?? 0) > (v.largura_max ?? Infinity) || (v.altura_min ?? 0) > (v.altura_max ?? Infinity)) { toast.error("O mínimo não pode ser maior que o máximo."); return; }
    const dados = {
      nome: f.nome.trim(), tipo_cobranca: f.tipo_cobranca, preco_base: v.preco_base ?? 0, valor_minimo: v.valor_minimo ?? 0,
      area_minima: f.tipo_cobranca === "area" ? v.area_minima ?? 0 : 0,
      largura_min: v.largura_min === null ? null : Math.round(v.largura_min), largura_max: v.largura_max === null ? null : Math.round(v.largura_max),
      altura_min: v.altura_min === null ? null : Math.round(v.altura_min), altura_max: v.altura_max === null ? null : Math.round(v.altura_max),
    };
    setSalvando(true);
    const res = produto
      ? await supabase.from("produtos").update(dados).eq("id", produto.id).select("id").single()
      : await supabase.from("produtos").insert({ ...dados, empresa_id: empresaId, ordem }).select("id").single();
    setSalvando(false);
    if (res.error || !res.data) { toast.error("Não foi possível salvar."); return; }
    toast.success(produto ? "Produto salvo." : "Produto criado. Agora adicione as opções.");
    recarregar();
    if (!produto) onCriado(res.data.id);
  }

  const c = "h-12 rounded-xl";
  const campo = (k: keyof typeof f, rotulo: string, ajuda?: string) => (
    <div className="space-y-1">
      <Label htmlFor={`p-${k}`}>{rotulo}</Label>
      <Input id={`p-${k}`} className={c} inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      {ajuda && <p className="text-xs text-muted-foreground">{ajuda}</p>}
    </div>
  );

  return (
    <div className="space-y-4 pb-24 pt-2">
      <button onClick={onFechar} className="flex items-center gap-2 text-sm font-medium text-primary"><ArrowLeft className="h-4 w-4" /> Produtos</button>
      <div className="space-y-1"><Label htmlFor="p-nome">Nome</Label><Input id="p-nome" className={c} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Box de correr" /></div>
      <div className="space-y-2">
        <Label>Cobrança</Label>
        <RadioGroup value={f.tipo_cobranca} onValueChange={(v) => setF({ ...f, tipo_cobranca: v as TipoCobranca })}>
          {COBRANCAS.map((o) => (
            <label key={o.v} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
              <RadioGroupItem value={o.v} className="mt-1" />
              <span><span className="block text-sm font-medium">{o.rotulo}</span><span className="text-xs text-muted-foreground">{o.ajuda}</span></span>
            </label>
          ))}
        </RadioGroup>
      </div>
      {campo("preco_base", "Preço base (R$)", "Ex.: 650,00")}
      {f.tipo_cobranca === "area" && campo("area_minima", "Área mínima cobrada (m²)", "Ex.: 1,5 — peças menores são cobradas como 1,5 m².")}
      {campo("valor_minimo", "Valor mínimo do item (R$)", "Opcional. Ex.: 150,00")}
      <div className="grid grid-cols-2 gap-3">{campo("largura_min", "Largura mín. (cm)")}{campo("largura_max", "Largura máx. (cm)")}</div>
      <div className="grid grid-cols-2 gap-3">{campo("altura_min", "Altura mín. (cm)")}{campo("altura_max", "Altura máx. (cm)")}</div>
      {produto ? <GruposOpcoes produto={produto} onMudou={recarregar} /> : <p className="text-sm text-muted-foreground">Salve o produto para adicionar opções (ex.: tipo de vidro).</p>}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-border bg-card p-3">
        <Button onClick={salvar} disabled={salvando} className="mx-auto flex h-12 w-full max-w-xl rounded-xl text-base">{salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar"}</Button>
      </div>
    </div>
  );
}
