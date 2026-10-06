import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { alterarAtivo, clonarEmpresa, diasVencida, listarEmpresasAdmin, type EmpresaAdmin } from "@/lib/admin";
import { definirEmpresaAtiva } from "@/lib/empresa-ativa";
import { data as fmtData } from "@/lib/format";
import { Carregando, Erro, Vazio } from "@/components/Estados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogoClonar } from "@/components/admin/DialogoClonar";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Empresas — OrçaJá Admin" }] }),
  component: AdminEmpresas,
});

function AdminEmpresas() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["admin-empresas"], queryFn: listarEmpresasAdmin });
  const [busca, setBusca] = useState("");
  const [clonando, setClonando] = useState<EmpresaAdmin | null>(null);

  const lista = (data ?? []).filter((e) => e.nome.toLowerCase().includes(busca.trim().toLowerCase()));

  async function alternar(e: EmpresaAdmin) {
    try {
      await alterarAtivo(e.id, !e.ativo);
      toast.success(e.ativo ? "Empresa suspensa." : "Empresa reativada.");
      qc.invalidateQueries({ queryKey: ["admin-empresas"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function clonar(nome: string) {
    if (!clonando) return;
    await clonarEmpresa(clonando.id, nome);
    toast.success("Empresa clonada.");
    setClonando(null);
    qc.invalidateQueries({ queryKey: ["admin-empresas"] });
  }

  function abrir(e: EmpresaAdmin) {
    definirEmpresaAtiva(e.id);
    navigate({ to: "/novo" });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-2xl font-bold text-foreground">Empresas ({data?.length ?? 0})</h1>
        <Button asChild className="h-11 rounded-xl">
          <Link to="/admin/empresas/nova"><Plus className="mr-1 h-4 w-4" /> Nova empresa</Link>
        </Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar empresa" value={busca} onChange={(e) => setBusca(e.target.value)} className="h-11 rounded-xl pl-9" />
      </div>
      {isLoading && <Carregando />}
      {error && <Erro texto={(error as Error).message} onTentar={() => refetch()} />}
      {data && lista.length === 0 && (
        <Vazio icone={Building2} titulo={busca ? "Nenhuma empresa encontrada" : "Nenhuma empresa ainda"} texto="Crie a primeira empresa para começar." />
      )}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {lista.map((e) => (
          <LinhaEmpresa key={e.id} e={e} onAbrir={() => abrir(e)} onClonar={() => setClonando(e)} onAlternar={() => alternar(e)} />
        ))}
      </div>
      <DialogoClonar aberto={!!clonando} origem={clonando?.nome ?? ""} onFechar={() => setClonando(null)} onConfirmar={clonar} />
    </div>
  );
}

interface LinhaProps {
  e: EmpresaAdmin;
  onAbrir: () => void;
  onClonar: () => void;
  onAlternar: () => void;
}

function LinhaEmpresa({ e, onAbrir, onClonar, onAlternar }: LinhaProps) {
  const atraso = diasVencida(e.pago_ate);
  return (
    <div className="grid gap-3 border-b border-border p-4 last:border-0 md:grid-cols-[2fr_1fr_1.3fr_1fr_auto] md:items-center">
      <p className="font-semibold text-foreground">{e.nome}</p>
      <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.ativo ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
        {e.ativo ? "Ativa" : "Suspensa"}
      </span>
      <div className="text-sm">
        <span className="text-muted-foreground">Pago até: </span>
        {e.pago_ate ? fmtData(e.pago_ate) : "—"}
        {atraso > 0 && <span className="ml-2 rounded-md bg-warning/10 px-1.5 py-0.5 text-xs font-semibold text-warning">Vencida há {atraso} {atraso === 1 ? "dia" : "dias"}</span>}
      </div>
      <p className="text-sm text-muted-foreground">{e.orcamentos_30d} orçamentos (30 dias)</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onAbrir} className="rounded-lg">Abrir</Button>
        <Button size="sm" variant="outline" asChild className="rounded-lg">
          <Link to="/admin/empresas/$id" params={{ id: e.id }}>Editar</Link>
        </Button>
        <Button size="sm" variant="outline" onClick={onClonar} className="rounded-lg">Clonar</Button>
        <Button size="sm" variant="outline" onClick={onAlternar} className={`rounded-lg ${e.ativo ? "text-destructive" : "text-success"}`}>
          {e.ativo ? "Suspender" : "Reativar"}
        </Button>
      </div>
    </div>
  );
}
