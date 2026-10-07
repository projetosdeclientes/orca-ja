import type { Adicional } from "@/lib/catalogo";
import type { TipoDesconto } from "@/lib/calculo";
import { calcularTotais, descricaoItem, type ItemOrc } from "@/lib/orcamento";
import { data as fmtData, moeda, parseDecimal } from "@/lib/format";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface ResumoEstado { marcados: string[]; descontoTipo: TipoDesconto; descontoTxt: string; observacoes: string }

interface Props { cliente: string; itens: ItemOrc[]; adicionais: Adicional[]; validade: string; estado: ResumoEstado; onChange: (e: ResumoEstado) => void }

export function PassoResumo({ cliente, itens, adicionais, validade, estado, onChange }: Props) {
  const ativos = adicionais.filter((a) => a.ativo);
  const t = calcularTotais({ itens, adicionais: ativos, marcados: estado.marcados, desconto: { tipo: estado.descontoTipo, valor: parseDecimal(estado.descontoTxt) || 0 } });
  const alternar = (id: string, v: boolean) => onChange({ ...estado, marcados: v ? [...estado.marcados, id] : estado.marcados.filter((x) => x !== id) });
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Cliente: <strong className="text-foreground">{cliente}</strong></p>
      <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card">
        {itens.map((i) => (
          <div key={i.chave} className="flex justify-between gap-2 text-sm">
            <span><span className="font-medium">{i.quantidade}× {i.produto_nome}</span><span className="block text-xs text-muted-foreground">{descricaoItem(i)}</span></span>
            <span className="font-semibold">{moeda(i.resultado.valor_total)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Subtotal</span><span>{moeda(t.subtotal)}</span></div>
      </div>
      {ativos.length > 0 && (
        <div className="space-y-2">
          <Label>Adicionais</Label>
          {ativos.map((a) => (
            <label key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm">
              <Checkbox checked={estado.marcados.includes(a.id)} onCheckedChange={(v) => alternar(a.id, v === true)} />
              <span className="flex-1">{a.nome}</span>
              <span className="font-medium">{a.tipo === "fixo" ? moeda(a.valor) : `${String(a.valor).replace(".", ",")}%`}</span>
            </label>
          ))}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="r-desc">Desconto</Label>
        <div className="flex gap-2">
          <Input id="r-desc" className="h-12 rounded-xl text-base" inputMode="decimal" placeholder="0" value={estado.descontoTxt} onChange={(e) => onChange({ ...estado, descontoTxt: e.target.value })} />
          <ToggleGroup type="single" value={estado.descontoTipo} onValueChange={(v) => v && onChange({ ...estado, descontoTipo: v as TipoDesconto })} className="rounded-xl border border-border bg-card p-1">
            <ToggleGroupItem value="valor" className="h-10 px-4">R$</ToggleGroupItem>
            <ToggleGroupItem value="percentual" className="h-10 px-4">%</ToggleGroupItem>
          </ToggleGroup>
        </div>
        {t.desconto_total > 0 && <p className="text-sm text-destructive">− {moeda(t.desconto_total)}</p>}
      </div>
      <div className="space-y-2"><Label htmlFor="r-obs">Observações</Label><Textarea id="r-obs" className="rounded-xl" value={estado.observacoes} onChange={(e) => onChange({ ...estado, observacoes: e.target.value })} /></div>
      <div className="rounded-2xl bg-primary-soft p-5">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">TOTAL</p>
        <p className="text-4xl font-extrabold text-primary">{moeda(t.total)}</p>
        <p className="mt-1 text-sm text-muted-foreground">Válido até {fmtData(validade)}</p>
      </div>
    </div>
  );
}
