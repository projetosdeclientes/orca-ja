COMMENT ON COLUMN public.empresas.observacoes_admin IS 'DEPRECATED: replaced by public.empresa_notas_admin.notas';
REVOKE UPDATE ON public.empresas FROM authenticated;
GRANT UPDATE (nome, logo_url, cor_primaria, whatsapp, endereco, texto_topo, condicoes_pagamento, prazo_entrega_padrao, validade_dias, ativo, pago_ate, slug) ON public.empresas TO authenticated;