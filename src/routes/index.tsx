import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { carregarPerfil, rotaInicial } from "@/lib/sessao";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "OrçaJá — Orçamento pronto na hora" },
      { name: "description", content: "Orçamentos por medidas com a tabela de preços da sua empresa, enviados pelo WhatsApp." },
      { property: "og:title", content: "OrçaJá — Orçamento pronto na hora" },
      { property: "og:description", content: "Orçamentos por medidas com a tabela de preços da sua empresa, enviados pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
    const perfil = await carregarPerfil().catch(() => null);
    throw redirect({ to: perfil ? rotaInicial(perfil.papel) : "/login" });
  },
  component: () => null,
});
