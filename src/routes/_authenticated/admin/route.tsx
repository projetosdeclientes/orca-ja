import { createFileRoute, Link, Navigate, Outlet, useNavigate } from "@tanstack/react-router";
import { Building2, LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/lib/sessao";
import { Carregando } from "@/components/Estados";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — OrçaJá" }] }),
  component: LayoutAdmin,
});

function LayoutAdmin() {
  const { data: sessao, isLoading } = useSessao();
  const navigate = useNavigate();
  if (isLoading) return <Carregando className="min-h-screen" />;
  if (!sessao) return <Navigate to="/login" />;
  if (!sessao.isSuper) return <Navigate to="/novo" />;

  const item = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent";
  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col">
        <div className="flex items-center justify-between px-5 py-4 md:block">
          <p className="text-lg font-extrabold">OrçaJá <span className="text-sidebar-primary">Admin</span></p>
          <button onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/login" }))} aria-label="Sair" className="md:hidden">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col">
          <Link to="/admin" activeOptions={{ exact: true }} className={item} activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}>
            <Building2 className="h-4 w-4" /> Empresas
          </Link>
          <Link to="/admin/configuracoes" className={item} activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}>
            <Settings className="h-4 w-4" /> Configurações
          </Link>
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/login" }))} className={`${item} m-3 hidden md:flex`}>
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
