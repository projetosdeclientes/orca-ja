import { useQuery } from "@tanstack/react-query";
import { listarEmpresasAdmin } from "@/lib/admin";
import { definirEmpresaAtiva } from "@/lib/empresa-ativa";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Seletor de empresa ativa (só para o Super Admin). */
export function SeletorEmpresa({ empresaId }: { empresaId: string }) {
  const { data } = useQuery({ queryKey: ["admin-empresas"], queryFn: listarEmpresasAdmin });
  return (
    <Select value={empresaId} onValueChange={(v) => definirEmpresaAtiva(v)}>
      <SelectTrigger aria-label="Empresa ativa" className="h-9 min-w-0 flex-1 rounded-lg border-border font-semibold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(data ?? []).map((e) => (
          <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
