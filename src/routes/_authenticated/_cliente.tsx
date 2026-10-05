import { useEffect } from "react";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useSessao } from "@/lib/sessao";
import { Carregando, Erro } from "@/components/Estados";
import { Suspenso } from "@/components/Suspenso";
import { Cabecalho } from "@/components/layout/Cabecalho";
import { NavInferior } from "@/components/layout/NavInferior";
import { FaixaSuperAdmin } from "@/components/layout/FaixaSuperAdmin";

export const Route = createFileRoute("/_authenticated/_cliente")({
  component: LayoutCliente,
});

/** Aplica a cor principal da empresa na variável CSS --primary. */
function useCorEmpresa(cor: string | undefined) {
  useEffect(() => {
    if (!cor || !/^#[0-9a-fA-F]{6}$/.test(cor)) return;
    const raiz = document.documentElement;
    raiz.style.setProperty("--primary", cor);
    return () => raiz.style.removeProperty("--primary");
  }, [cor]);
}

function LayoutCliente() {
  const { data: sessao, isLoading, error, refetch } = useSessao();
  useCorEmpresa(sessao?.empresa?.cor_primaria);

  if (isLoading) return <Carregando className="min-h-screen" />;
  if (error) return <div className="p-6"><Erro texto={(error as Error).message} onTentar={() => refetch()} /></div>;
  if (!sessao) return <Navigate to="/login" />;
  if (!sessao.empresa) return sessao.isSuper ? <Navigate to="/admin" /> : <Suspenso />;
  if (!sessao.empresa.ativo && !sessao.isSuper) return <Suspenso />;

  return (
    <div className="min-h-screen bg-background pb-24">
      {sessao.isSuper && <FaixaSuperAdmin nome={sessao.empresa.nome} />}
      <Cabecalho empresa={sessao.empresa} isSuper={sessao.isSuper} />
      <main className="mx-auto w-full max-w-xl px-4 pt-4">
        <Outlet />
      </main>
      <NavInferior mostrarConfig={sessao.podeConfigurar} />
    </div>
  );
}
