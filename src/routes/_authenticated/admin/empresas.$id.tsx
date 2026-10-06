import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listarEmpresasAdmin } from "@/lib/admin";
import { definirEmpresaAtiva } from "@/lib/empresa-ativa";
import { mascaraTelefone, whatsComDDI } from "@/lib/format";
import { Carregando, Erro } from "@/components/Estados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/empresas/$id")({
  head: () => ({ meta: [{ title: "Editar empresa — OrçaJá Admin" }] }),
  component: EditarEmpresa,
});

function EditarEmpresa() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-empresas"], queryFn: listarEmpresasAdmin });
  const empresa = data?.find((e) => e.id === id);
  const [f, setF] = useState({ nome: "", whatsapp: "", pago_ate: "", observacoes_admin: "", ativo: true });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (empresa)
      setF({ nome: empresa.nome, whatsapp: empresa.whatsapp ?? "", pago_ate: empresa.pago_ate ?? "", observacoes_admin: empresa.observacoes_admin ?? "", ativo: empresa.ativo });
  }, [empresa]);

  if (isLoading) return <Carregando />;
  if (error || !empresa) return <Erro texto="Empresa não encontrada." />;

  async function salvar() {
    if (f.nome.trim().length < 2) { toast.error("Informe o nome."); return; }
    setSalvando(true);
    const { error: e } = await supabase
      .from("empresas")
      .update({ nome: f.nome.trim(), whatsapp: whatsComDDI(f.whatsapp) || null, pago_ate: f.pago_ate || null, observacoes_admin: f.observacoes_admin || null, ativo: f.ativo })
      .eq("id", id);
    setSalvando(false);
    if (e) { toast.error("Não foi possível salvar."); return; }
    toast.success("Alterações salvas.");
    qc.invalidateQueries({ queryKey: ["admin-empresas"] });
    navigate({ to: "/admin" });
  }

  const c = "h-11 rounded-xl";
  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h1 className="text-xl font-bold text-foreground">Editar empresa</h1>
      <div className="space-y-2"><Label htmlFor="f-nome">Nome</Label><Input id="f-nome" className={c} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="f-whats">WhatsApp</Label><Input id="f-whats" className={c} inputMode="tel" value={mascaraTelefone(f.whatsapp)} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="f-pago">Pago até</Label><Input id="f-pago" className={c} type="date" value={f.pago_ate} onChange={(e) => setF({ ...f, pago_ate: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="f-obs">Observações internas (só o admin vê)</Label><Textarea className="rounded-xl" value={f.observacoes_admin} onChange={(e) => setF({ ...f, observacoes_admin: e.target.value })} /></div>
      <label className="flex items-center justify-between text-sm font-medium">Empresa ativa <Switch checked={f.ativo} onCheckedChange={(v) => setF({ ...f, ativo: v })} /></label>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button onClick={salvar} disabled={salvando} className="h-11 flex-1 rounded-xl">{salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
        <Button variant="outline" className="h-11 rounded-xl" onClick={() => { definirEmpresaAtiva(id); navigate({ to: "/config" }); }}>Abrir configurações</Button>
      </div>
    </div>
  );
}
