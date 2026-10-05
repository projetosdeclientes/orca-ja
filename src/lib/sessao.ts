import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaAtiva } from "./empresa-ativa";

export type Papel = "super_admin" | "dono" | "vendedor";

export interface Perfil {
  id: string;
  empresa_id: string | null;
  nome: string;
  papel: Papel;
}

/** Colunas de empresas legíveis por usuários comuns (observacoes_admin fica de fora). */
export const EMPRESA_COLS =
  "id,nome,slug,logo_url,cor_primaria,whatsapp,endereco,texto_topo,condicoes_pagamento,prazo_entrega_padrao,validade_dias,ativo,pago_ate,created_at";

export interface Empresa {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  cor_primaria: string;
  whatsapp: string | null;
  endereco: string | null;
  texto_topo: string | null;
  condicoes_pagamento: string | null;
  prazo_entrega_padrao: string | null;
  validade_dias: number;
  ativo: boolean;
  pago_ate: string | null;
  created_at: string;
}

export interface Sessao {
  userId: string;
  email: string;
  perfil: Perfil;
  empresa: Empresa | null;
  isSuper: boolean;
  podeConfigurar: boolean;
}

export async function carregarPerfil(): Promise<Perfil | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from("perfis").select("id,empresa_id,nome,papel").eq("id", u.user.id).maybeSingle();
  if (error) throw new Error("Não foi possível carregar seu perfil.");
  return (data as Perfil | null) ?? null;
}

async function carregarSessao(empresaAtiva: string | null): Promise<Sessao | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const perfil = await carregarPerfil();
  if (!perfil) throw new Error("Seu usuário não tem perfil. Fale com o suporte.");
  const isSuper = perfil.papel === "super_admin";
  const empresaId = isSuper ? empresaAtiva : perfil.empresa_id;
  let empresa: Empresa | null = null;
  if (empresaId) {
    const { data } = await supabase.from("empresas").select(EMPRESA_COLS).eq("id", empresaId).maybeSingle();
    empresa = (data as Empresa | null) ?? null;
  }
  return {
    userId: u.user.id,
    email: u.user.email ?? "",
    perfil,
    empresa,
    isSuper,
    podeConfigurar: isSuper || perfil.papel === "dono",
  };
}

export function useSessao() {
  const ativa = useEmpresaAtiva();
  return useQuery({ queryKey: ["sessao", ativa], queryFn: () => carregarSessao(ativa), staleTime: 60_000 });
}

/** Sessão garantida (usar dentro do layout do cliente, que já valida). */
export function useSessaoOk(): Sessao & { empresa: Empresa } {
  const { data } = useSessao();
  if (!data?.empresa) throw new Error("Empresa não carregada");
  return data as Sessao & { empresa: Empresa };
}

export function rotaInicial(papel: Papel): "/admin" | "/novo" {
  return papel === "super_admin" ? "/admin" : "/novo";
}
