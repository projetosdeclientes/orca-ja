
-- ========== TABELAS ==========
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  cor_primaria text NOT NULL DEFAULT '#0F62FE',
  whatsapp text,
  endereco text,
  texto_topo text,
  condicoes_pagamento text,
  prazo_entrega_padrao text,
  validade_dias integer NOT NULL DEFAULT 7 CHECK (validade_dias BETWEEN 1 AND 365),
  ativo boolean NOT NULL DEFAULT true,
  pago_ate date,
  observacoes_admin text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.perfis (
  id uuid PRIMARY KEY,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  papel text NOT NULL CHECK (papel IN ('super_admin','dono','vendedor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((papel = 'super_admin' AND empresa_id IS NULL) OR (papel <> 'super_admin' AND empresa_id IS NOT NULL))
);
CREATE INDEX perfis_empresa_idx ON public.perfis(empresa_id);

CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  categoria text,
  tipo_cobranca text NOT NULL DEFAULT 'area' CHECK (tipo_cobranca IN ('area','linear','unidade')),
  preco_base numeric(12,2) NOT NULL DEFAULT 0 CHECK (preco_base >= 0),
  area_minima numeric(10,3) NOT NULL DEFAULT 0 CHECK (area_minima >= 0),
  valor_minimo numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_minimo >= 0),
  largura_min integer CHECK (largura_min >= 0),
  largura_max integer CHECK (largura_max >= 0),
  altura_min integer CHECK (altura_min >= 0),
  altura_max integer CHECK (altura_max >= 0),
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX produtos_empresa_idx ON public.produtos(empresa_id, ordem);

CREATE TABLE public.grupos_opcao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  obrigatorio boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX grupos_produto_idx ON public.grupos_opcao(produto_id, ordem);

CREATE TABLE public.opcoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES public.grupos_opcao(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo_acrescimo text NOT NULL DEFAULT 'fixo' CHECK (tipo_acrescimo IN ('fixo','por_m2','percentual')),
  valor numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX opcoes_grupo_idx ON public.opcoes(grupo_id, ordem);

CREATE TABLE public.adicionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'fixo' CHECK (tipo IN ('fixo','percentual')),
  valor numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  marcado_por_padrao boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX adicionais_empresa_idx ON public.adicionais(empresa_id, ordem);

CREATE TABLE public.orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero integer NOT NULL DEFAULT 0,
  token_publico text NOT NULL DEFAULT '' ,
  cliente_nome text NOT NULL,
  cliente_telefone text,
  cliente_endereco text,
  status text NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado','aprovado','perdido')),
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  desconto_tipo text NOT NULL DEFAULT 'valor' CHECK (desconto_tipo IN ('valor','percentual')),
  desconto_valor numeric(12,2) NOT NULL DEFAULT 0 CHECK (desconto_valor >= 0),
  desconto_total numeric(12,2) NOT NULL DEFAULT 0,
  adicionais_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  validade_ate date,
  observacoes text,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, numero)
);
CREATE UNIQUE INDEX orcamentos_token_idx ON public.orcamentos(token_publico);
CREATE INDEX orcamentos_empresa_data_idx ON public.orcamentos(empresa_id, created_at DESC);

CREATE TABLE public.orcamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  produto_nome text NOT NULL,
  descricao text,
  largura_cm numeric(10,2),
  altura_cm numeric(10,2),
  quantidade integer NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  area_m2 numeric(10,4),
  valor_unitario numeric(12,2) NOT NULL DEFAULT 0,
  valor_total numeric(12,2) NOT NULL DEFAULT 0,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ordem integer NOT NULL DEFAULT 0
);
CREATE INDEX itens_orcamento_idx ON public.orcamento_itens(orcamento_id, ordem);

-- contador interno (sem acesso pela API)
CREATE TABLE public.empresa_contadores (
  empresa_id uuid PRIMARY KEY REFERENCES public.empresas(id) ON DELETE CASCADE,
  ultimo integer NOT NULL DEFAULT 0
);

-- ========== FUNÇÕES AUXILIARES ==========
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND papel = 'super_admin')
$$;

CREATE OR REPLACE FUNCTION public.empresa_atual()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT empresa_id FROM public.perfis WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.papel_atual()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT papel FROM public.perfis WHERE id = auth.uid()
$$;

-- membro de empresa ATIVA, ou super admin
CREATE OR REPLACE FUNCTION public.pode_acessar_empresa(_empresa uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.perfis p JOIN public.empresas e ON e.id = p.empresa_id
    WHERE p.id = auth.uid() AND p.empresa_id = _empresa AND e.ativo
  )
$$;

-- dono de empresa ATIVA, ou super admin
CREATE OR REPLACE FUNCTION public.pode_configurar_empresa(_empresa uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.perfis p JOIN public.empresas e ON e.id = p.empresa_id
    WHERE p.id = auth.uid() AND p.empresa_id = _empresa AND p.papel = 'dono' AND e.ativo
  )
$$;

CREATE OR REPLACE FUNCTION public.empresa_do_produto(_produto uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT empresa_id FROM public.produtos WHERE id = _produto
$$;

CREATE OR REPLACE FUNCTION public.empresa_do_grupo(_grupo uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.empresa_id FROM public.grupos_opcao g JOIN public.produtos p ON p.id = g.produto_id WHERE g.id = _grupo
$$;

CREATE OR REPLACE FUNCTION public.empresa_do_orcamento(_orc uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT empresa_id FROM public.orcamentos WHERE id = _orc
$$;

-- ========== TRIGGERS ==========
CREATE OR REPLACE FUNCTION public.orcamentos_antes_inserir()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _n integer;
BEGIN
  INSERT INTO public.empresa_contadores(empresa_id, ultimo) VALUES (NEW.empresa_id, 0)
    ON CONFLICT (empresa_id) DO NOTHING;
  UPDATE public.empresa_contadores SET ultimo = ultimo + 1
    WHERE empresa_id = NEW.empresa_id RETURNING ultimo INTO _n;
  NEW.numero := _n;
  NEW.token_publico := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  NEW.criado_por := auth.uid();
  NEW.created_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER trg_orcamentos_inserir BEFORE INSERT ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.orcamentos_antes_inserir();

CREATE OR REPLACE FUNCTION public.orcamentos_antes_alterar()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.id := OLD.id;
  NEW.empresa_id := OLD.empresa_id;
  NEW.numero := OLD.numero;
  NEW.token_publico := OLD.token_publico;
  NEW.criado_por := OLD.criado_por;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_orcamentos_alterar BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.orcamentos_antes_alterar();

-- dono não altera campos administrativos
CREATE OR REPLACE FUNCTION public.empresas_antes_alterar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin() THEN
    NEW.ativo := OLD.ativo;
    NEW.pago_ate := OLD.pago_ate;
    NEW.slug := OLD.slug;
    NEW.observacoes_admin := OLD.observacoes_admin;
  END IF;
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_empresas_alterar BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.empresas_antes_alterar();

-- ========== GRANTS ==========
-- empresas: coluna observacoes_admin NÃO é legível por usuários comuns
GRANT SELECT (id, nome, slug, logo_url, cor_primaria, whatsapp, endereco, texto_topo, condicoes_pagamento,
  prazo_entrega_padrao, validade_dias, ativo, pago_ate, created_at) ON public.empresas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfis TO authenticated;
GRANT ALL ON public.perfis TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grupos_opcao TO authenticated;
GRANT ALL ON public.grupos_opcao TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opcoes TO authenticated;
GRANT ALL ON public.opcoes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adicionais TO authenticated;
GRANT ALL ON public.adicionais TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamentos TO authenticated;
GRANT ALL ON public.orcamentos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_itens TO authenticated;
GRANT ALL ON public.orcamento_itens TO service_role;
REVOKE ALL ON public.empresa_contadores FROM anon, authenticated;
GRANT ALL ON public.empresa_contadores TO service_role;

-- ========== RLS ==========
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_opcao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adicionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_contadores ENABLE ROW LEVEL SECURITY;

-- empresas (leitura da própria mesmo suspensa, para mostrar a tela de bloqueio)
CREATE POLICY empresas_select ON public.empresas FOR SELECT TO authenticated
  USING (public.is_super_admin() OR id = public.empresa_atual());
CREATE POLICY empresas_insert ON public.empresas FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());
CREATE POLICY empresas_update ON public.empresas FOR UPDATE TO authenticated
  USING (public.pode_configurar_empresa(id)) WITH CHECK (public.pode_configurar_empresa(id));
CREATE POLICY empresas_delete ON public.empresas FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- perfis
CREATE POLICY perfis_select ON public.perfis FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_super_admin() OR (empresa_id IS NOT NULL AND empresa_id = public.empresa_atual()));
CREATE POLICY perfis_insert ON public.perfis FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
CREATE POLICY perfis_update ON public.perfis FOR UPDATE TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY perfis_delete ON public.perfis FOR DELETE TO authenticated USING (public.is_super_admin());

-- produtos
CREATE POLICY produtos_select ON public.produtos FOR SELECT TO authenticated USING (public.pode_acessar_empresa(empresa_id));
CREATE POLICY produtos_insert ON public.produtos FOR INSERT TO authenticated WITH CHECK (public.pode_configurar_empresa(empresa_id));
CREATE POLICY produtos_update ON public.produtos FOR UPDATE TO authenticated
  USING (public.pode_configurar_empresa(empresa_id)) WITH CHECK (public.pode_configurar_empresa(empresa_id));
CREATE POLICY produtos_delete ON public.produtos FOR DELETE TO authenticated USING (public.pode_configurar_empresa(empresa_id));

-- grupos_opcao
CREATE POLICY grupos_select ON public.grupos_opcao FOR SELECT TO authenticated
  USING (public.pode_acessar_empresa(public.empresa_do_produto(produto_id)));
CREATE POLICY grupos_insert ON public.grupos_opcao FOR INSERT TO authenticated
  WITH CHECK (public.pode_configurar_empresa(public.empresa_do_produto(produto_id)));
CREATE POLICY grupos_update ON public.grupos_opcao FOR UPDATE TO authenticated
  USING (public.pode_configurar_empresa(public.empresa_do_produto(produto_id)))
  WITH CHECK (public.pode_configurar_empresa(public.empresa_do_produto(produto_id)));
CREATE POLICY grupos_delete ON public.grupos_opcao FOR DELETE TO authenticated
  USING (public.pode_configurar_empresa(public.empresa_do_produto(produto_id)));

-- opcoes
CREATE POLICY opcoes_select ON public.opcoes FOR SELECT TO authenticated
  USING (public.pode_acessar_empresa(public.empresa_do_grupo(grupo_id)));
CREATE POLICY opcoes_insert ON public.opcoes FOR INSERT TO authenticated
  WITH CHECK (public.pode_configurar_empresa(public.empresa_do_grupo(grupo_id)));
CREATE POLICY opcoes_update ON public.opcoes FOR UPDATE TO authenticated
  USING (public.pode_configurar_empresa(public.empresa_do_grupo(grupo_id)))
  WITH CHECK (public.pode_configurar_empresa(public.empresa_do_grupo(grupo_id)));
CREATE POLICY opcoes_delete ON public.opcoes FOR DELETE TO authenticated
  USING (public.pode_configurar_empresa(public.empresa_do_grupo(grupo_id)));

-- adicionais
CREATE POLICY adicionais_select ON public.adicionais FOR SELECT TO authenticated USING (public.pode_acessar_empresa(empresa_id));
CREATE POLICY adicionais_insert ON public.adicionais FOR INSERT TO authenticated WITH CHECK (public.pode_configurar_empresa(empresa_id));
CREATE POLICY adicionais_update ON public.adicionais FOR UPDATE TO authenticated
  USING (public.pode_configurar_empresa(empresa_id)) WITH CHECK (public.pode_configurar_empresa(empresa_id));
CREATE POLICY adicionais_delete ON public.adicionais FOR DELETE TO authenticated USING (public.pode_configurar_empresa(empresa_id));

-- orcamentos (vendedor cria/vê/altera status; só dono/super exclui)
CREATE POLICY orcamentos_select ON public.orcamentos FOR SELECT TO authenticated USING (public.pode_acessar_empresa(empresa_id));
CREATE POLICY orcamentos_insert ON public.orcamentos FOR INSERT TO authenticated WITH CHECK (public.pode_acessar_empresa(empresa_id));
CREATE POLICY orcamentos_update ON public.orcamentos FOR UPDATE TO authenticated
  USING (public.pode_acessar_empresa(empresa_id)) WITH CHECK (public.pode_acessar_empresa(empresa_id));
CREATE POLICY orcamentos_delete ON public.orcamentos FOR DELETE TO authenticated USING (public.pode_configurar_empresa(empresa_id));

-- itens
CREATE POLICY itens_select ON public.orcamento_itens FOR SELECT TO authenticated
  USING (public.pode_acessar_empresa(public.empresa_do_orcamento(orcamento_id)));
CREATE POLICY itens_insert ON public.orcamento_itens FOR INSERT TO authenticated
  WITH CHECK (public.pode_acessar_empresa(public.empresa_do_orcamento(orcamento_id)));
CREATE POLICY itens_update ON public.orcamento_itens FOR UPDATE TO authenticated
  USING (public.pode_configurar_empresa(public.empresa_do_orcamento(orcamento_id)))
  WITH CHECK (public.pode_configurar_empresa(public.empresa_do_orcamento(orcamento_id)));
CREATE POLICY itens_delete ON public.orcamento_itens FOR DELETE TO authenticated
  USING (public.pode_configurar_empresa(public.empresa_do_orcamento(orcamento_id)));

-- ========== RPCs ==========
-- Página pública: só aquele orçamento + itens + identidade da empresa
CREATE OR REPLACE FUNCTION public.obter_orcamento_publico(_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'orcamento', jsonb_build_object(
      'numero', o.numero, 'cliente_nome', o.cliente_nome, 'status', o.status,
      'subtotal', o.subtotal, 'desconto_tipo', o.desconto_tipo, 'desconto_valor', o.desconto_valor,
      'desconto_total', o.desconto_total, 'adicionais_snapshot', o.adicionais_snapshot,
      'total', o.total, 'validade_ate', o.validade_ate, 'observacoes', o.observacoes, 'created_at', o.created_at),
    'itens', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'produto_nome', i.produto_nome, 'descricao', i.descricao, 'largura_cm', i.largura_cm,
        'altura_cm', i.altura_cm, 'quantidade', i.quantidade, 'area_m2', i.area_m2,
        'valor_unitario', i.valor_unitario, 'valor_total', i.valor_total) ORDER BY i.ordem)
      FROM public.orcamento_itens i WHERE i.orcamento_id = o.id), '[]'::jsonb),
    'empresa', jsonb_build_object(
      'nome', e.nome, 'logo_url', e.logo_url, 'cor_primaria', e.cor_primaria, 'whatsapp', e.whatsapp,
      'endereco', e.endereco, 'texto_topo', e.texto_topo, 'condicoes_pagamento', e.condicoes_pagamento,
      'prazo_entrega_padrao', e.prazo_entrega_padrao)
  )
  FROM public.orcamentos o JOIN public.empresas e ON e.id = o.empresa_id
  WHERE length(_token) >= 32 AND o.token_publico = _token
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.obter_orcamento_publico(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obter_orcamento_publico(text) TO anon, authenticated;

-- Super admin: lista de empresas com observações e contagem de 30 dias
CREATE OR REPLACE FUNCTION public.admin_listar_empresas()
RETURNS TABLE (id uuid, nome text, slug text, logo_url text, cor_primaria text, whatsapp text, ativo boolean,
  pago_ate date, observacoes_admin text, created_at timestamptz, orcamentos_30d bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  RETURN QUERY SELECT e.id, e.nome, e.slug, e.logo_url, e.cor_primaria, e.whatsapp, e.ativo, e.pago_ate,
    e.observacoes_admin, e.created_at,
    (SELECT count(*) FROM public.orcamentos o WHERE o.empresa_id = e.id AND o.created_at >= now() - interval '30 days')
  FROM public.empresas e ORDER BY e.nome;
END $$;
REVOKE ALL ON FUNCTION public.admin_listar_empresas() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_listar_empresas() TO authenticated;

-- Super admin: copia catálogo (produtos, grupos, opções, adicionais) entre empresas
CREATE OR REPLACE FUNCTION public.admin_copiar_catalogo(_origem uuid, _destino uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; g record; _np uuid; _ng uuid;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  FOR p IN SELECT * FROM public.produtos WHERE empresa_id = _origem LOOP
    INSERT INTO public.produtos(empresa_id, nome, categoria, tipo_cobranca, preco_base, area_minima, valor_minimo,
      largura_min, largura_max, altura_min, altura_max, ativo, ordem)
    VALUES (_destino, p.nome, p.categoria, p.tipo_cobranca, p.preco_base, p.area_minima, p.valor_minimo,
      p.largura_min, p.largura_max, p.altura_min, p.altura_max, p.ativo, p.ordem) RETURNING id INTO _np;
    FOR g IN SELECT * FROM public.grupos_opcao WHERE produto_id = p.id LOOP
      INSERT INTO public.grupos_opcao(produto_id, nome, obrigatorio, ordem)
      VALUES (_np, g.nome, g.obrigatorio, g.ordem) RETURNING id INTO _ng;
      INSERT INTO public.opcoes(grupo_id, nome, tipo_acrescimo, valor, ativo, ordem)
      SELECT _ng, nome, tipo_acrescimo, valor, ativo, ordem FROM public.opcoes WHERE grupo_id = g.id;
    END LOOP;
  END LOOP;
  INSERT INTO public.adicionais(empresa_id, nome, tipo, valor, marcado_por_padrao, ativo, ordem)
  SELECT _destino, nome, tipo, valor, marcado_por_padrao, ativo, ordem FROM public.adicionais WHERE empresa_id = _origem;
END $$;
REVOKE ALL ON FUNCTION public.admin_copiar_catalogo(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_copiar_catalogo(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.orcamentos_antes_inserir() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.empresas_antes_alterar() FROM PUBLIC, anon, authenticated;
