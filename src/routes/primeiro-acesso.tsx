import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { criarPrimeiroSuperAdmin, statusPrimeiroAcesso } from "@/lib/usuarios.functions";
import { supabase } from "@/integrations/supabase/client";
import { Marca } from "@/components/Marca";
import { Carregando } from "@/components/Estados";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/primeiro-acesso")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Primeiro acesso — OrçaJá" },
      { name: "description", content: "Configuração inicial do OrçaJá." },
      { property: "og:title", content: "Primeiro acesso — OrçaJá" },
      { property: "og:description", content: "Configuração inicial do OrçaJá." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrimeiroAcesso,
});

function PrimeiroAcesso() {
  const navigate = useNavigate();
  const status = useServerFn(statusPrimeiroAcesso);
  const criar = useServerFn(criarPrimeiroSuperAdmin);
  const { data, isLoading } = useQuery({ queryKey: ["primeiro-acesso"], queryFn: () => status() });
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await criar({ data: form });
      await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.senha });
      toast.success("Super admin criado!");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar.");
    } finally {
      setEnviando(false);
    }
  }

  if (isLoading) return <Carregando className="min-h-screen" />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10">
      <Marca className="mb-6" />
      {!data?.liberado ? (
        <p className="max-w-sm text-center text-muted-foreground">Esta página não está mais disponível.</p>
      ) : (
        <form onSubmit={enviar} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h1 className="text-lg font-bold text-foreground">Criar o primeiro Super Admin</h1>
          {(["nome", "email", "senha"] as const).map((campo) => (
            <div key={campo} className="space-y-2">
              <Label htmlFor={campo}>{campo === "nome" ? "Nome" : campo === "email" ? "E-mail" : "Senha (mín. 8 caracteres)"}</Label>
              <Input
                id={campo}
                type={campo === "senha" ? "password" : campo === "email" ? "email" : "text"}
                value={form[campo]}
                onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                className="h-12 rounded-xl"
                required
              />
            </div>
          ))}
          <Button type="submit" disabled={enviando} className="h-12 w-full rounded-xl text-base">
            {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar Super Admin"}
          </Button>
        </form>
      )}
    </main>
  );
}
