import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Empresa } from "@/lib/sessao";
import { mascaraTelefone, whatsComDDI } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DEZ_ANOS = 60 * 60 * 24 * 365 * 10;

export function AbaIdentidade({ empresa }: { empresa: Empresa }) {
  const qc = useQueryClient();
  const arquivo = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({
    nome: empresa.nome, cor_primaria: empresa.cor_primaria, whatsapp: empresa.whatsapp ?? "", endereco: empresa.endereco ?? "",
    texto_topo: empresa.texto_topo ?? "", condicoes_pagamento: empresa.condicoes_pagamento ?? "",
    prazo_entrega_padrao: empresa.prazo_entrega_padrao ?? "", validade_dias: String(empresa.validade_dias), logo_url: empresa.logo_url,
  });
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);

  function mudarCor(cor: string) {
    setF({ ...f, cor_primaria: cor });
    document.documentElement.style.setProperty("--primary", cor); // aplica na hora
  }

  async function enviarLogo(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Escolha uma imagem.");
    if (file.size > 2 * 1024 * 1024) return toast.error("A imagem deve ter até 2 MB.");
    setEnviandoLogo(true);
    const caminho = `${empresa.id}/logo-${Date.now()}.${file.name.split(".").pop() ?? "png"}`;
    const { error } = await supabase.storage.from("logos").upload(caminho, file, { upsert: true });
    const { data } = error ? { data: null } : await supabase.storage.from("logos").createSignedUrl(caminho, DEZ_ANOS);
    setEnviandoLogo(false);
    if (!data?.signedUrl) return toast.error("Não foi possível enviar a logo.");
    setF((x) => ({ ...x, logo_url: data.signedUrl }));
    toast.success("Logo carregada. Toque em Salvar alterações.");
  }

  async function salvar() {
    const validade = Number(f.validade_dias);
    if (f.nome.trim().length < 2) return toast.error("Informe o nome da empresa.");
    if (!Number.isInteger(validade) || validade < 1 || validade > 365) return toast.error("Validade deve ser de 1 a 365 dias.");
    setSalvando(true);
    const { error } = await supabase.from("empresas").update({
      nome: f.nome.trim(), cor_primaria: f.cor_primaria, whatsapp: whatsComDDI(f.whatsapp) || null, endereco: f.endereco || null,
      texto_topo: f.texto_topo || null, condicoes_pagamento: f.condicoes_pagamento || null,
      prazo_entrega_padrao: f.prazo_entrega_padrao || null, validade_dias: validade, logo_url: f.logo_url,
    }).eq("id", empresa.id);
    setSalvando(false);
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Alterações salvas.");
    qc.invalidateQueries({ queryKey: ["sessao"] });
  }

  const c = "h-12 rounded-xl";
  const texto = (k: "endereco" | "texto_topo" | "condicoes_pagamento" | "prazo_entrega_padrao", rotulo: string, area = false) => (
    <div className="space-y-2">
      <Label htmlFor={`id-${k}`}>{rotulo}</Label>
      {area ? <Textarea id={`id-${k}`} className="rounded-xl" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        : <Input id={`id-${k}`} className={c} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}
    </div>
  );

  return (
    <div className="space-y-4 pb-20 pt-2">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
        {f.logo_url ? <img src={f.logo_url} alt="Logo" className="h-16 w-16 rounded-xl object-contain" /> : <span className="grid h-16 w-16 place-items-center rounded-xl bg-muted text-muted-foreground"><ImagePlus className="h-6 w-6" /></span>}
        <Button variant="outline" className="rounded-xl" disabled={enviandoLogo} onClick={() => arquivo.current?.click()}>
          {enviandoLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : f.logo_url ? "Trocar logo" : "Enviar logo"}
        </Button>
        <input ref={arquivo} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && enviarLogo(e.target.files[0])} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="id-cor">Cor principal</Label>
        <div className="flex items-center gap-3">
          <input id="id-cor" type="color" value={f.cor_primaria} onChange={(e) => mudarCor(e.target.value)} className="h-12 w-16 cursor-pointer rounded-xl border border-border bg-card" />
          <span className="font-mono text-sm text-muted-foreground">{f.cor_primaria.toUpperCase()}</span>
        </div>
      </div>
      <div className="space-y-2"><Label htmlFor="id-nome">Nome da empresa</Label><Input id="id-nome" className={c} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="id-whats">WhatsApp</Label><Input id="id-whats" className={c} inputMode="tel" placeholder="(11) 91234-5678" value={mascaraTelefone(f.whatsapp)} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
      {texto("endereco", "Endereço")}
      {texto("texto_topo", "Texto do topo do orçamento", true)}
      {texto("condicoes_pagamento", "Condições de pagamento", true)}
      {texto("prazo_entrega_padrao", "Prazo de entrega padrão")}
      <div className="space-y-2"><Label htmlFor="id-val">Validade do orçamento (dias)</Label><Input id="id-val" className={c} inputMode="numeric" value={f.validade_dias} onChange={(e) => setF({ ...f, validade_dias: e.target.value.replace(/\D/g, "") })} /></div>
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-border bg-card p-3">
        <Button onClick={salvar} disabled={salvando} className="mx-auto flex h-12 w-full max-w-xl rounded-xl text-base">{salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar alterações"}</Button>
      </div>
    </div>
  );
}
