import type { Cliente } from "@/lib/orcamento";
import { mascaraTelefone } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PassoCliente({ cliente, onChange }: { cliente: Cliente; onChange: (c: Cliente) => void }) {
  const c = "h-12 rounded-xl text-base";
  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label htmlFor="c-nome">Nome do cliente</Label><Input id="c-nome" className={c} autoComplete="off" value={cliente.nome} onChange={(e) => onChange({ ...cliente, nome: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="c-tel">WhatsApp do cliente</Label><Input id="c-tel" className={c} inputMode="tel" placeholder="(11) 91234-5678" value={mascaraTelefone(cliente.telefone)} onChange={(e) => onChange({ ...cliente, telefone: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="c-end">Endereço (opcional)</Label><Input id="c-end" className={c} value={cliente.endereco} onChange={(e) => onChange({ ...cliente, endereco: e.target.value })} /></div>
    </div>
  );
}
