import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useSessaoOk } from "@/lib/sessao";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AbaIdentidade } from "@/components/config/AbaIdentidade";
import { AbaProdutos } from "@/components/config/AbaProdutos";
import { AbaAdicionais } from "@/components/config/AbaAdicionais";

export const Route = createFileRoute("/_authenticated/_cliente/config")({
  head: () => ({ meta: [{ title: "Configurações — OrçaJá" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const sessao = useSessaoOk();
  if (!sessao.podeConfigurar) return <Navigate to="/novo" />;
  return (
    <Tabs defaultValue="produtos">
      <TabsList className="grid h-12 w-full grid-cols-3 rounded-xl">
        <TabsTrigger value="identidade" className="rounded-lg">Identidade</TabsTrigger>
        <TabsTrigger value="produtos" className="rounded-lg">Produtos</TabsTrigger>
        <TabsTrigger value="adicionais" className="rounded-lg">Adicionais</TabsTrigger>
      </TabsList>
      <TabsContent value="identidade"><AbaIdentidade empresa={sessao.empresa} /></TabsContent>
      <TabsContent value="produtos"><AbaProdutos empresaId={sessao.empresa.id} /></TabsContent>
      <TabsContent value="adicionais"><AbaAdicionais empresaId={sessao.empresa.id} /></TabsContent>
    </Tabs>
  );
}
