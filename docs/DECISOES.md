# Decisões

- "Edge Functions" pedidas (primeiro-acesso, criar-usuario-empresa) foram implementadas como funções de servidor (createServerFn) da própria aplicação: a plataforma (TanStack Start) roda no servidor e proíbe Edge Functions; a validação continua 100% no servidor com a chave de serviço só lá.
- Número sequencial por empresa: tabela interna empresa_contadores com UPDATE ... RETURNING (trava de linha) dentro de trigger + UNIQUE(empresa_id, numero). Sem duplicidade mesmo com salvamentos simultâneos.
- token_publico: 64 caracteres hexadecimais aleatórios (2 UUIDs v4) gerados por trigger; não pode ser alterado depois.
- observacoes_admin: protegido por permissão de coluna (usuários comuns não conseguem ler a coluna); o Super Admin lê via funções admin_* que checam o papel no banco. Trigger impede dono de alterar ativo, pago_ate, slug e observacoes_admin.
- Empresa suspensa: além da tela de bloqueio, a RLS nega acesso a produtos/orçamentos etc. dessa empresa.
- Logos: bucket privado (workspace bloqueia buckets públicos). Ao enviar, o app gera um link assinado de 10 anos e grava em empresas.logo_url, para a logo aparecer também na página pública.
- Cadastro público desativado na configuração de autenticação (disable_signup = true); usuários são criados só pelo servidor com a chave de serviço.
- Modelos Vidraçaria/Cortinas (src/lib/modelos.ts) foram criados junto da tela de nova empresa (1.8) para conectar direto, evitando retrabalho na 2.5.
- Página pública /o/$token: rota fora da área logada, lê só a RPC obter_orcamento_publico; cor da empresa via variável --primary; PDF = window.print() com CSS de impressão A4.
- Cálculo: preço usa a área exata (sem arredondar); só valores em R$ e o area_m2 exibido são arredondados a 2 casas.
