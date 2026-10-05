import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { linkSuporte } from "@/lib/config";
import { Button } from "@/components/ui/button";

/** Tela exibida quando a empresa está suspensa (ativo = false). */
export function Suspenso() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-warning/10 text-warning">
        <Lock className="h-7 w-7" strokeWidth={1.5} />
      </span>
      <h1 className="text-xl font-bold text-foreground">Acesso suspenso. Fale com o suporte</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">O acesso da sua empresa está temporariamente bloqueado.</p>
      <Button asChild className="mt-6 h-12 w-full max-w-xs rounded-xl text-base">
        <a href={linkSuporte()} target="_blank" rel="noreferrer">Falar com o suporte</a>
      </Button>
      <button onClick={() => supabase.auth.signOut()} className="mt-4 text-sm font-medium text-muted-foreground underline">
        Sair
      </button>
    </main>
  );
}
