import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdicionais, useRecarregarCatalogo, type Adicional } from "@/lib/catalogo";
import { paraCampo, parseDecimal } from "@/lib/format";
import { Carregando, Erro, Vazio } from "@/components/Estados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AbaAdicionais({ empresaId }: { empresaId: string }) {
  const { data, isLoading, error, refetch } = useAdicionais(empresaId);
  const recarregar = useRecarregarCatalogo(empresaId);

  async function salvar(id: string, campos: Partial<Adicional>) {
    const { error: e } = await supabase.from("adicionais").update(campos).eq("id", id);
    if (e) toast.error("Não foi possível salvar.");
    recarregar();
  }
  async function novo() {
    const { error: e } = await supabase.from("adicionais").insert({ empresa_id: empresaId, nome: "Novo adicional", ordem: data?.length ?? 0 });
    if (e) toast.error("Não foi possível criar.");
    recarregar();
  }
  async function excluir(a: Adicional) {
    if (!window.confirm(`Excluir "${a.nome}"?`)) return;
    await supabase.from("adicionais").delete().eq("id", a.id);
    recarregar();
  }

  if (isLoading) return <Carregando />;
  if (error) return <Erro texto={(error as Error).message} onTentar={() => refetch()} />;
  return (
    <div className="space-y-3 pt-2">
      <Button onClick={novo} className="h-12 w-full rounded-xl"><Plus className="mr-1 h-4 w-4" /> Novo adicional</Button>
      {data?.length === 0 && <Vazio icone={Plus} titulo="Nenhum adicional" texto="Ex.: Instalação, Frete." />}
      {data?.map((a) => (
        <div key={a.id} className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex gap-2">
            <Input aria-label="Nome" defaultValue={a.nome} className="h-11 rounded-xl" onBlur={(e) => e.target.value.trim() && e.target.value !== a.nome && salvar(a.id, { nome: e.target.value.trim() })} />
            <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => excluir(a)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
          <div className="flex gap-2">
            <Select value={a.tipo} onValueChange={(v) => salvar(a.id, { tipo: v as Adicional["tipo"] })}>
              <SelectTrigger className="h-11 w-36 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="fixo">Valor fixo (R$)</SelectItem><SelectItem value="percentual">Percentual (%)</SelectItem></SelectContent>
            </Select>
            <Input aria-label="Valor" inputMode="decimal" defaultValue={paraCampo(a.valor)} className="h-11 rounded-xl"
              onBlur={(e) => { const v = parseDecimal(e.target.value); if (Number.isNaN(v) || v < 0) { toast.error("Valor inválido."); return; } if (v !== Number(a.valor)) salvar(a.id, { valor: v }); }} />
          </div>
          <label className="flex items-center justify-between text-sm">Vem marcado por padrão <Switch checked={a.marcado_por_padrao} onCheckedChange={(v) => salvar(a.id, { marcado_por_padrao: v })} /></label>
          <label className="flex items-center justify-between text-sm">Ativo <Switch checked={a.ativo} onCheckedChange={(v) => salvar(a.id, { ativo: v })} /></label>
        </div>
      ))}
    </div>
  );
}
