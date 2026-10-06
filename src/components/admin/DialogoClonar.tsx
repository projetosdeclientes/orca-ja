import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DialogoClonarProps {
  aberto: boolean;
  origem: string;
  onFechar: () => void;
  onConfirmar: (nome: string) => Promise<void>;
}

export function DialogoClonar({ aberto, origem, onFechar, onConfirmar }: DialogoClonarProps) {
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    if (aberto) setNome("");
  }, [aberto]);

  async function confirmar() {
    if (nome.trim().length < 2) { toast.error("Informe o nome da nova empresa."); return; }
    setEnviando(true);
    try {
      await onConfirmar(nome);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Clonar “{origem}”</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Copia identidade, produtos, opções e adicionais. Não copia orçamentos nem usuários.</p>
        <div className="space-y-2">
          <Label htmlFor="novo-nome">Nome da nova empresa</Label>
          <Input id="novo-nome" value={nome} onChange={(e) => setNome(e.target.value)} className="h-11 rounded-xl" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={confirmar} disabled={enviando}>{enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Clonar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
