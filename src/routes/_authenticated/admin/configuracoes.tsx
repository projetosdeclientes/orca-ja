import { createFileRoute } from "@tanstack/react-router";
import { SUPORTE_WHATSAPP } from "@/lib/config";
import { mascaraTelefone } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — OrçaJá Admin" }] }),
  component: () => (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <p className="text-sm text-muted-foreground">WhatsApp do suporte (usado no login e na tela de acesso suspenso)</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{mascaraTelefone(SUPORTE_WHATSAPP)}</p>
        <p className="mt-2 text-xs text-muted-foreground">Para alterar, peça a troca do número no arquivo de configuração do suporte.</p>
      </div>
    </div>
  ),
});
