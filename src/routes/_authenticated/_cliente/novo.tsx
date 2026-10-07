import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Eye, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSessaoOk } from "@/lib/sessao";
import { useAdicionais, useCatalogo } from "@/lib/catalogo";
import { calcularTotais, descricaoItem, linkWhatsCliente, mensagemCliente, montarItem, salvarOrcamento, type Cliente, type ItemOrc, type OpcaoEscolhida } from "@/lib/orcamento";
import { hojeISO, hojeMaisDias, parseDecimal, soDigitos } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Carregando, Erro } from "@/components/Estados";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DocumentoOrcamento } from "@/components/DocumentoOrcamento";
import { PassoCliente } from "@/components/novo/PassoCliente";
import { PassoItens } from "@/components/novo/PassoItens";
import { PassoResumo, type ResumoEstado } from "@/components/novo/PassoResumo";

export const Route = createFileRoute("/_authenticated/_cliente/novo")({
  validateSearch: z.object({ duplicar: z.string().uuid().optional() }),
  head: () => ({ meta: [{ title: "Novo orçamento — OrçaJá" }] }),
  component: NovoOrcamento,
});

const TITULOS = ["Novo orçamento", "Itens", "Resumo"];

function NovoOrcamento() {
  const { empresa } = useSessaoOk();
  const { duplicar } = Route.useSearch();
  const navigate = useNavigate();
  const cat = useCatalogo(empresa.id);
  const adic = useAdicionais(empresa.id);
  const [passo, setPasso] = useState(1);
  const [cliente, setCliente] = useState<Cliente>({ nome: "", telefone: "", endereco: "" });
  const [itens, setItens] = useState<ItemOrc[]>([]);
  const [resumo, setResumo] = useState<ResumoEstado | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [previa, setPrevia] = useState(false);
  const validade = hojeMaisDias(empresa.validade_dias);

  // Adicionais marcados por padrão (uma vez, quando carregam).
  useEffect(() => {
    if (adic.data && !resumo) setResumo({ marcados: adic.data.filter((a) => a.ativo && a.marcado_por_padrao).map((a) => a.id), descontoTipo: "valor", descontoTxt: "", observacoes: "" });
  }, [adic.data, resumo]);

  // Duplicar: mesmos itens recalculados com os preços ATUAIS.
  useEffect(() => {
    if (!duplicar || !cat.data) return;
    (async () => {
      const { data: o } = await supabase.from("orcamentos").select("cliente_nome, cliente_telefone, cliente_endereco, orcamento_itens(quantidade, largura_cm, altura_cm, snapshot, ordem)").eq("id", duplicar).maybeSingle();
      if (!o) return;
      setCliente({ nome: o.cliente_nome, telefone: o.cliente_telefone ?? "", endereco: o.cliente_endereco ?? "" });
      const novos: ItemOrc[] = [];
      for (const i of [...o.orcamento_itens].sort((a, b) => a.ordem - b.ordem)) {
        const snap = i.snapshot as { produto_id?: string; opcoes?: OpcaoEscolhida[] };
        const p = cat.data.find((x) => x.id === snap.produto_id && x.ativo);
        if (!p) { toast.warning("Um produto não existe mais e foi ignorado."); continue; }
        novos.push(montarItem(p, Object.fromEntries((snap.opcoes ?? []).map((x) => [x.grupo_id, x.opcao_id])), Number(i.largura_cm ?? 0), Number(i.altura_cm ?? 0), i.quantidade));
      }
      setItens(novos);
      navigate({ to: "/novo", search: {}, replace: true });
    })();
  }, [duplicar, cat.data, navigate]);

  if (cat.isLoading || adic.isLoading || !resumo) return <Carregando />;
  if (cat.error || adic.error) return <Erro texto="Não foi possível carregar os produtos." onTentar={() => { cat.refetch(); adic.refetch(); }} />;

  function avancar() {
    if (passo === 1) {
      if (cliente.nome.trim().length < 2) return void toast.error("Informe o nome do cliente.");
      const d = soDigitos(cliente.telefone);
      if (d && d.length < 10) return void toast.error("WhatsApp incompleto.");
    }
    if (passo === 2 && itens.length === 0) return void toast.error("Adicione pelo menos um item.");
    setPasso(passo + 1);
    window.scrollTo({ top: 0 });
  }

  const entrada = () => ({ itens, adicionais: (adic.data ?? []).filter((a) => a.ativo), marcados: resumo!.marcados, desconto: { tipo: resumo!.descontoTipo, valor: parseDecimal(resumo!.descontoTxt) || 0 } });

  async function salvar(enviar: boolean) {
    if (enviar && soDigitos(cliente.telefone).length < 10) return void toast.error("Informe o WhatsApp do cliente para enviar.");
    const janela = enviar ? window.open("", "_blank") : null; // abre antes para não ser bloqueada
    setSalvando(true);
    try {
      const r = await salvarOrcamento({ ...entrada(), empresaId: empresa.id, cliente, observacoes: resumo!.observacoes, validade_ate: validade });
      toast.success("Orçamento salvo!");
      if (enviar) {
        const link = linkWhatsCliente(cliente.telefone, mensagemCliente({ cliente: cliente.nome.trim(), numero: r.numero, empresa: empresa.nome, total: r.total, validade, token: r.token }));
        if (janela) janela.location.href = link; else window.location.href = link;
      }
      navigate({ to: "/orcamentos/$id", params: { id: r.id } });
    } catch (e) {
      janela?.close();
      toast.error((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  const t = calcularTotais(entrada());
  return (
    <div className="space-y-5 pb-44">
      <div>
        <h1 className="text-xl font-bold text-foreground">{TITULOS[passo - 1]} <span className="text-muted-foreground">{passo}/3</span></h1>
        <div className="mt-2 grid grid-cols-3 gap-1.5">{[1, 2, 3].map((n) => <span key={n} className={cn("h-1.5 rounded-full", n <= passo ? "bg-primary" : "bg-border")} />)}</div>
      </div>
      {passo === 1 && <PassoCliente cliente={cliente} onChange={setCliente} />}
      {passo === 2 && <PassoItens produtos={cat.data ?? []} itens={itens} onChange={setItens} />}
      {passo === 3 && <PassoResumo cliente={cliente.nome} itens={itens} adicionais={adic.data ?? []} validade={validade} estado={resumo} onChange={setResumo} />}

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-border bg-card p-3">
        <div className="mx-auto max-w-xl space-y-2">
          {passo < 3 ? (
            <div className="flex gap-2">
              {passo > 1 && <Button variant="outline" className="h-12 rounded-xl" onClick={() => setPasso(passo - 1)}><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Button>}
              <Button className="h-12 flex-1 rounded-xl text-base" onClick={avancar}>Continuar <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </div>
          ) : (
            <>
              <Button disabled={salvando} className="h-12 w-full rounded-xl bg-whatsapp text-base text-whatsapp-foreground hover:bg-whatsapp/90" onClick={() => salvar(true)}>
                {salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : <><MessageCircle className="mr-2 h-5 w-5" /> Salvar e enviar no WhatsApp</>}
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="h-11 rounded-xl" onClick={() => setPasso(2)}><ArrowLeft className="h-4 w-4" /></Button>
                <Button variant="outline" disabled={salvando} className="h-11 rounded-xl" onClick={() => salvar(false)}>Só salvar</Button>
                <Button variant="outline" className="h-11 rounded-xl" onClick={() => setPrevia(true)}><Eye className="mr-1 h-4 w-4" /> Prévia</Button>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={previa} onOpenChange={setPrevia}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-3">
          <DialogTitle className="sr-only">Prévia do orçamento</DialogTitle>
          <DocumentoOrcamento d={{
            orcamento: { numero: 0, cliente_nome: cliente.nome, subtotal: t.subtotal, desconto_total: t.desconto_total, adicionais_snapshot: t.adicionais_snapshot, total: t.total, validade_ate: validade, observacoes: resumo.observacoes || null, created_at: hojeISO() },
            itens: itens.map((i) => ({ produto_nome: i.produto_nome, descricao: descricaoItem(i), quantidade: i.quantidade, valor_total: i.resultado.valor_total })),
            empresa,
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
