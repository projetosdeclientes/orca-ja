import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { criarUsuarioEmpresa } from "@/lib/usuarios.functions";
import { listarEmpresasAdmin, slugUnico } from "@/lib/admin";
import { MODELOS, aplicarModelo, type ChaveModelo } from "@/lib/modelos";
import { mascaraTelefone, whatsComDDI } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/empresas/nova")({
  head: () => ({ meta: [{ title: "Nova empresa — OrçaJá Admin" }] }),
  component: NovaEmpresa,
});

type Origem = ChaveModelo | "copiar" | "branco";

function gerarSenha(): string {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(10);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => c[n % c.length]).join("");
}

function NovaEmpresa() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const criarUsuario = useServerFn(criarUsuarioEmpresa);
  const { data: empresas } = useQuery({ queryKey: ["admin-empresas"], queryFn: listarEmpresasAdmin });
  const [f, setF] = useState({ nome: "", whatsapp: "", email: "", senha: "", pago_ate: "" });
  const [origem, setOrigem] = useState<Origem>("vidracaria");
  const [copiarDe, setCopiarDe] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function criar(e: FormEvent) {
    e.preventDefault();
    if (f.nome.trim().length < 2) { toast.error("Informe o nome da empresa."); return; }
    if (!f.email.trim()) { toast.error("Informe o e-mail do dono."); return; }
    if (f.senha.length < 8) { toast.error("A senha precisa de pelo menos 8 caracteres."); return; }
    if (origem === "copiar" && !copiarDe) { toast.error("Escolha a empresa a copiar."); return; }
    setEnviando(true);
    let empresaId: string | null = null;
    try {
      const { data: nova, error } = await supabase
        .from("empresas")
        .insert({ nome: f.nome.trim(), slug: slugUnico(f.nome), whatsapp: whatsComDDI(f.whatsapp) || null, pago_ate: f.pago_ate || null })
        .select("id")
        .single();
      if (error || !nova) throw new Error("Não foi possível criar a empresa.");
      empresaId = nova.id;
      await criarUsuario({ data: { empresa_id: nova.id, nome: f.nome.trim(), email: f.email.trim(), senha: f.senha } });
      if (origem === "copiar") {
        const { error: e2 } = await supabase.rpc("admin_copiar_catalogo", { _origem: copiarDe, _destino: nova.id });
        if (e2) throw new Error("Empresa criada, mas houve erro ao copiar os produtos.");
      } else if (origem !== "branco") {
        await aplicarModelo(nova.id, MODELOS[origem]);
      }
      toast.success("Empresa criada! Envie ao dono o e-mail e a senha.");
      qc.invalidateQueries({ queryKey: ["admin-empresas"] });
      navigate({ to: "/admin" });
    } catch (err) {
      const msg = (err as Error).message;
      // Se o usuário não foi criado, desfaz a empresa para não deixar sobra.
      if (empresaId && !msg.startsWith("Empresa criada")) await supabase.from("empresas").delete().eq("id", empresaId);
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  }

  const campo = "h-11 rounded-xl";
  return (
    <form onSubmit={criar} className="mx-auto max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h1 className="text-xl font-bold text-foreground">Nova empresa</h1>
      <div className="space-y-2"><Label>Nome da empresa</Label><Input className={campo} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div className="space-y-2"><Label>WhatsApp</Label><Input className={campo} inputMode="tel" placeholder="(11) 91234-5678" value={mascaraTelefone(f.whatsapp)} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
      <div className="space-y-2"><Label>E-mail do dono</Label><Input className={campo} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div className="space-y-2">
        <Label>Senha inicial</Label>
        <div className="flex gap-2">
          <Input className={campo} value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} />
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setF({ ...f, senha: gerarSenha() })}><KeyRound className="mr-1 h-4 w-4" />Gerar senha</Button>
        </div>
      </div>
      <div className="space-y-2"><Label>Pago até</Label><Input className={campo} type="date" value={f.pago_ate} onChange={(e) => setF({ ...f, pago_ate: e.target.value })} /></div>
      <div className="space-y-2">
        <Label>Começar a partir de</Label>
        <RadioGroup value={origem} onValueChange={(v) => setOrigem(v as Origem)} className="space-y-1">
          {(Object.keys(MODELOS) as ChaveModelo[]).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm"><RadioGroupItem value={k} /> {MODELOS[k].rotulo}</label>
          ))}
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="copiar" /> Copiar de outra empresa</label>
          {origem === "copiar" && (
            <Select value={copiarDe} onValueChange={setCopiarDe}>
              <SelectTrigger className="ml-6 h-11 w-auto rounded-xl"><SelectValue placeholder="Escolha a empresa" /></SelectTrigger>
              <SelectContent>{(empresas ?? []).map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="branco" /> Em branco</label>
        </RadioGroup>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={enviando} className="h-11 flex-1 rounded-xl">{enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar empresa"}</Button>
        <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => navigate({ to: "/admin" })}>Cancelar</Button>
      </div>
    </form>
  );
}
