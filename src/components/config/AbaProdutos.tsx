import { useState } from "react";
import { Copy, Package, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { duplicarProduto, ROTULO_COBRANCA, useCatalogo, useRecarregarCatalogo, type Produto } from "@/lib/catalogo";
import { moeda, numero } from "@/lib/format";
import { Carregando, Erro, Vazio } from "@/components/Estados";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EditorProduto } from "./EditorProduto";

export function AbaProdutos({ empresaId }: { empresaId: string }) {
  const { data, isLoading, error, refetch } = useCatalogo(empresaId);
  const recarregar = useRecarregarCatalogo(empresaId);
  const [editando, setEditando] = useState<string | "novo" | null>(null);

  if (editando) {
    const produto = editando === "novo" ? null : data?.find((p) => p.id === editando) ?? null;
    return <EditorProduto empresaId={empresaId} produto={produto} ordem={data?.length ?? 0} onCriado={setEditando} onFechar={() => setEditando(null)} />;
  }

  async function alternar(p: Produto, ativo: boolean) {
    const { error: e } = await supabase.from("produtos").update({ ativo }).eq("id", p.id);
    if (e) toast.error("Não foi possível alterar.");
    recarregar();
  }
  async function duplicar(p: Produto) {
    try { await duplicarProduto(p); toast.success("Produto duplicado."); recarregar(); }
    catch (e) { toast.error((e as Error).message); }
  }

  if (isLoading) return <Carregando />;
  if (error) return <Erro texto={(error as Error).message} onTentar={() => refetch()} />;
  return (
    <div className="space-y-3 pt-2">
      <Button onClick={() => setEditando("novo")} className="h-12 w-full rounded-xl"><Plus className="mr-1 h-4 w-4" /> Novo produto</Button>
      {data?.length === 0 && <Vazio icone={Package} titulo="Nenhum produto ainda" texto="Cadastre seu primeiro produto, ex.: Box de correr." />}
      {data?.map((p) => (
        <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">{p.nome}</p>
              <p className="text-sm text-muted-foreground">
                {moeda(p.preco_base)} {ROTULO_COBRANCA[p.tipo_cobranca]}
                {p.tipo_cobranca === "area" && Number(p.area_minima) > 0 && ` · mínimo ${numero(p.area_minima, 3)} m²`}
              </p>
            </div>
            <Switch aria-label="Ativo" checked={p.ativo} onCheckedChange={(v) => alternar(p, v)} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setEditando(p.id)}><Pencil className="mr-1 h-4 w-4" /> Editar</Button>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => duplicar(p)}><Copy className="mr-1 h-4 w-4" /> Duplicar</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
