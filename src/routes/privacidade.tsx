import { createFileRoute } from "@tanstack/react-router";
import { PaginaTexto } from "@/components/PaginaTexto";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — OrçaJá" },
      { name: "description", content: "Como o OrçaJá trata dados pessoais, conforme a LGPD." },
      { property: "og:title", content: "Política de privacidade — OrçaJá" },
      { property: "og:description", content: "Como o OrçaJá trata dados pessoais, conforme a LGPD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PaginaTexto titulo="Política de privacidade">
      <p>Esta política segue a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>
      <h2>Dados dos clientes finais</h2>
      <p>Os dados dos clientes finais (nome, telefone, endereço) pertencem à empresa contratante, que é a controladora. O OrçaJá atua apenas como operador, armazenando esses dados para gerar os orçamentos.</p>
      <h2>Segurança</h2>
      <p>Cada empresa só acessa os próprios dados. O link público de um orçamento mostra apenas aquele orçamento.</p>
      <h2>Direitos do titular</h2>
      <p>Pedidos de acesso, correção ou exclusão devem ser feitos à empresa que emitiu o orçamento.</p>
    </PaginaTexto>
  ),
});
