import { createFileRoute } from "@tanstack/react-router";
import { PaginaTexto } from "@/components/PaginaTexto";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — OrçaJá" },
      { name: "description", content: "Termos de uso do OrçaJá, gerador de orçamentos por medidas." },
      { property: "og:title", content: "Termos de uso — OrçaJá" },
      { property: "og:description", content: "Termos de uso do OrçaJá, gerador de orçamentos por medidas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PaginaTexto titulo="Termos de uso">
      <p>O OrçaJá é uma ferramenta para gerar orçamentos por medidas, disponibilizada às empresas contratantes.</p>
      <h2>Acesso</h2>
      <p>Não há cadastro público. As contas são criadas pelo administrador do sistema e são pessoais e intransferíveis.</p>
      <h2>Responsabilidades</h2>
      <p>A empresa contratante é responsável pelos preços, produtos e informações que cadastra e pelos orçamentos que envia aos seus clientes.</p>
      <h2>Suspensão</h2>
      <p>O acesso pode ser suspenso em caso de uso indevido ou falta de pagamento.</p>
    </PaginaTexto>
  ),
});
