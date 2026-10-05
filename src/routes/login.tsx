import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { carregarPerfil, rotaInicial } from "@/lib/sessao";
import { linkSuporte } from "@/lib/config";
import { Marca } from "@/components/Marca";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — OrçaJá" },
      { name: "description", content: "Acesse o OrçaJá e faça orçamentos por medidas na hora." },
      { property: "og:title", content: "Entrar — OrçaJá" },
      { property: "og:description", content: "Acesse o OrçaJá e faça orçamentos por medidas na hora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !senha) {
      toast.error("Informe e-mail e senha.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) {
      setEnviando(false);
      toast.error(error.message.includes("Invalid") ? "E-mail ou senha incorretos." : "Não foi possível entrar. Tente novamente.");
      return;
    }
    const perfil = await carregarPerfil().catch(() => null);
    setEnviando(false);
    if (!perfil) {
      await supabase.auth.signOut();
      toast.error("Usuário sem acesso configurado. Fale com o suporte.");
      return;
    }
    navigate({ to: rotaInicial(perfil.papel) });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10">
      <Marca className="mb-2" />
      <p className="mb-8 text-muted-foreground">Orçamento pronto na hora</p>
      <form onSubmit={entrar} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <div className="relative">
            <Input id="senha" type={ver ? "text" : "password"} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="h-12 rounded-xl pr-12" />
            <button type="button" aria-label={ver ? "Ocultar senha" : "Mostrar senha"} onClick={() => setVer((v) => !v)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground">
              {ver ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <Button type="submit" disabled={enviando} className="h-12 w-full rounded-xl text-base font-semibold">
          {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
        </Button>
      </form>
      <p className="mt-6 max-w-sm text-center text-sm text-muted-foreground">
        Sem cadastro público. Problemas para entrar?{" "}
        <a href={linkSuporte()} target="_blank" rel="noreferrer" className="font-semibold text-primary">
          Fale com o suporte.
        </a>
      </p>
      <footer className="mt-10 text-xs text-muted-foreground">
        <Link to="/termos" className="hover:underline">Termos de uso</Link> · <Link to="/privacidade" className="hover:underline">Política de privacidade</Link>
      </footer>
    </main>
  );
}
