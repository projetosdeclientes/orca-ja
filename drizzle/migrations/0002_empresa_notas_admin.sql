CREATE TABLE public.empresa_notas_admin (
  empresa_id uuid PRIMARY KEY REFERENCES public.empresas(id) ON DELETE CASCADE,
  notas text,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa_notas_admin TO authenticated;
GRANT ALL ON public.empresa_notas_admin TO service_role;
ALTER TABLE public.empresa_notas_admin ENABLE ROW LEVEL SECURITY;
CREATE POLICY notas_admin_super ON public.empresa_notas_admin FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

INSERT INTO public.empresa_notas_admin (empresa_id, notas)
SELECT id, observacoes_admin FROM public.empresas WHERE observacoes_admin IS NOT NULL
ON CONFLICT (empresa_id) DO NOTHING;

-- Lista do admin passa a ler as notas da nova tabela
CREATE OR REPLACE FUNCTION public.admin_listar_empresas()
RETURNS TABLE (id uuid, nome text, slug text, logo_url text, cor_primaria text, whatsapp text, ativo boolean,
  pago_ate date, observacoes_admin text, created_at timestamptz, orcamentos_30d bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  RETURN QUERY SELECT e.id, e.nome, e.slug, e.logo_url, e.cor_primaria, e.whatsapp, e.ativo, e.pago_ate,
    n.notas, e.created_at,
    (SELECT count(*) FROM public.orcamentos o WHERE o.empresa_id = e.id AND o.created_at >= now() - interval '30 days')
  FROM public.empresas e LEFT JOIN public.empresa_notas_admin n ON n.empresa_id = e.id ORDER BY e.nome;
END $$;

-- Trigger: quem não é super admin nunca altera slug, pago_ate e ativo
CREATE OR REPLACE FUNCTION public.empresas_antes_alterar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin() THEN
    NEW.slug := OLD.slug;
    NEW.pago_ate := OLD.pago_ate;
    NEW.ativo := OLD.ativo;
  END IF;
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.empresas_antes_alterar() FROM PUBLIC, anon, authenticated;