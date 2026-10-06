import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trocarOrdem, type Grupo, type Opcao, type Produto } from "@/lib/catalogo";
import type { TipoAcrescimo } from "@/lib/calculo";
import { paraCampo, parseDecimal } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props { produto: Produto; onMudou: () => void }

export function GruposOpcoes({ produto, onMudou }: Props) {
  async function exec(p: PromiseLike<{ error: unknown }>) {
    const { error } = await p;
    if (error) toast.error("Não foi possível salvar.");
    onMudou();
  }
  const novoGrupo = () => exec(supabase.from("grupos_opcao").insert({ produto_id: produto.id, nome: "Novo grupo", ordem: produto.grupos.length }));
  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-foreground">Opções do produto</h2>
      {produto.grupos.map((g, i) => (
        <CartaoGrupo key={g.id} g={g} anterior={produto.grupos[i - 1]} proximo={produto.grupos[i + 1]} i={i} exec={exec} onMudou={onMudou} />
      ))}
      <Button variant="outline" className="h-11 w-full rounded-xl" onClick={novoGrupo}><Plus className="mr-1 h-4 w-4" /> Novo grupo</Button>
    </section>
  );
}

interface CartaoProps { g: Grupo; anterior?: Grupo; proximo?: Grupo; i: number; exec: (p: PromiseLike<{ error: unknown }>) => Promise<void>; onMudou: () => void }

function CartaoGrupo({ g, anterior, proximo, i, exec, onMudou }: CartaoProps) {
  const mover = async (o: Grupo | undefined, j: number) => { if (o) { await trocarOrdem("grupos_opcao", g, o, i, j); onMudou(); } };
  const excluir = () => window.confirm(`Excluir o grupo "${g.nome}" e suas opções?`) && exec(supabase.from("grupos_opcao").delete().eq("id", g.id));
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-1">
        <Input aria-label="Nome do grupo" defaultValue={g.nome} className="h-10 rounded-xl font-semibold" onBlur={(e) => e.target.value.trim() && e.target.value !== g.nome && exec(supabase.from("grupos_opcao").update({ nome: e.target.value.trim() }).eq("id", g.id))} />
        <Button size="icon" variant="ghost" aria-label="Subir" disabled={!anterior} onClick={() => mover(anterior, i - 1)}><ArrowUp className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Descer" disabled={!proximo} onClick={() => mover(proximo, i + 1)}><ArrowDown className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Excluir grupo" onClick={excluir}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
      <label className="flex items-center justify-between text-sm">Obrigatório <Switch checked={g.obrigatorio} onCheckedChange={(v) => exec(supabase.from("grupos_opcao").update({ obrigatorio: v }).eq("id", g.id))} /></label>
      {g.opcoes.map((o, j) => <LinhaOpcao key={o.id} o={o} j={j} anterior={g.opcoes[j - 1]} proximo={g.opcoes[j + 1]} exec={exec} onMudou={onMudou} />)}
      <button className="text-sm font-semibold text-primary" onClick={() => exec(supabase.from("opcoes").insert({ grupo_id: g.id, nome: "Nova opção", ordem: g.opcoes.length }))}>+ Adicionar opção</button>
    </div>
  );
}

interface LinhaProps { o: Opcao; j: number; anterior?: Opcao; proximo?: Opcao; exec: CartaoProps["exec"]; onMudou: () => void }

function LinhaOpcao({ o, j, anterior, proximo, exec, onMudou }: LinhaProps) {
  const upd = (c: Partial<Opcao>) => exec(supabase.from("opcoes").update(c).eq("id", o.id));
  const mover = async (x: Opcao | undefined, k: number) => { if (x) { await trocarOrdem("opcoes", o, x, j, k); onMudou(); } };
  return (
    <div className="space-y-2 rounded-xl bg-muted/50 p-3">
      <div className="flex items-center gap-1">
        <Input aria-label="Nome da opção" defaultValue={o.nome} className="h-10 rounded-xl bg-card" onBlur={(e) => e.target.value.trim() && e.target.value !== o.nome && upd({ nome: e.target.value.trim() })} />
        <Button size="icon" variant="ghost" aria-label="Subir" disabled={!anterior} onClick={() => mover(anterior, j - 1)}><ArrowUp className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Descer" disabled={!proximo} onClick={() => mover(proximo, j + 1)}><ArrowDown className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Excluir opção" onClick={() => window.confirm(`Excluir "${o.nome}"?`) && exec(supabase.from("opcoes").delete().eq("id", o.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
      <div className="flex items-center gap-2">
        <Select value={o.tipo_acrescimo} onValueChange={(v) => upd({ tipo_acrescimo: v as TipoAcrescimo })}>
          <SelectTrigger className="h-10 w-36 rounded-xl bg-card"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="fixo">+ R$ fixo</SelectItem><SelectItem value="por_m2">+ R$ por m²</SelectItem><SelectItem value="percentual">+ % do valor</SelectItem></SelectContent>
        </Select>
        <Input aria-label="Valor" inputMode="decimal" defaultValue={paraCampo(o.valor)} className="h-10 rounded-xl bg-card"
          onBlur={(e) => { const v = parseDecimal(e.target.value || "0"); if (Number.isNaN(v) || v < 0) { toast.error("Valor inválido."); return; } if (v !== Number(o.valor)) upd({ valor: v }); }} />
        <Switch aria-label="Ativa" checked={o.ativo} onCheckedChange={(v) => upd({ ativo: v })} />
      </div>
    </div>
  );
}
