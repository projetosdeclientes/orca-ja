import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Funções de servidor com a chave de serviço (equivalem às "Edge Functions" pedidas).
 * O cliente administrativo só é carregado dentro dos handlers.
 */

async function existeSuperAdmin(): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin.from("perfis").select("id", { count: "exact", head: true }).eq("papel", "super_admin");
  if (error) throw new Error("Não foi possível verificar o sistema.");
  return (count ?? 0) > 0;
}

export const statusPrimeiroAcesso = createServerFn({ method: "GET" }).handler(async () => {
  return { liberado: !(await existeSuperAdmin()) };
});

const esquemaNovoUsuario = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(100),
  email: z.string().trim().email("E-mail inválido.").max(255),
  senha: z.string().min(8, "A senha precisa de pelo menos 8 caracteres.").max(72),
});

export const criarPrimeiroSuperAdmin = createServerFn({ method: "POST" })
  .validator((d: unknown) => esquemaNovoUsuario.parse(d))
  .handler(async ({ data }) => {
    // Trava definitiva verificada no servidor.
    if (await existeSuperAdmin()) throw new Error("O primeiro acesso já foi realizado.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
    });
    if (error || !criado.user) throw new Error(error?.message.includes("already") ? "Este e-mail já está em uso." : "Não foi possível criar o usuário.");
    const { error: e2 } = await supabaseAdmin.from("perfis").insert({ id: criado.user.id, nome: data.nome, papel: "super_admin" });
    if (e2) {
      await supabaseAdmin.auth.admin.deleteUser(criado.user.id);
      throw new Error("Não foi possível criar o perfil.");
    }
    return { ok: true };
  });

export const criarUsuarioEmpresa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => esquemaNovoUsuario.extend({ empresa_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Valida o papel do CHAMADOR com o token dele (RLS aplicada).
    const { data: ehSuper, error: eRole } = await context.supabase.rpc("is_super_admin");
    if (eRole || ehSuper !== true) throw new Error("Apenas o Super Admin pode criar usuários.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: empresa } = await supabaseAdmin.from("empresas").select("id").eq("id", data.empresa_id).maybeSingle();
    if (!empresa) throw new Error("Empresa não encontrada.");
    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
    });
    if (error || !criado.user) throw new Error(error?.message.includes("already") ? "Este e-mail já está em uso." : "Não foi possível criar o usuário.");
    const { error: e2 } = await supabaseAdmin
      .from("perfis")
      .insert({ id: criado.user.id, nome: data.nome, papel: "dono", empresa_id: data.empresa_id });
    if (e2) {
      await supabaseAdmin.auth.admin.deleteUser(criado.user.id);
      throw new Error("Não foi possível criar o perfil do dono.");
    }
    return { userId: criado.user.id };
  });
