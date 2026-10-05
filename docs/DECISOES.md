# Decisões

- "Edge Functions" pedidas (primeiro-acesso, criar-usuario-empresa) foram implementadas como funções de servidor (createServerFn) da própria aplicação: a plataforma (TanStack Start) roda no servidor e proíbe Edge Functions; a validação continua 100% no servidor com a chave de serviço só lá.
- Número sequencial por empresa: tabela interna empresa_contadores com UPDATE ... RETURNING (trava de linha) dentro de trigger + UNIQUE(empresa_id, numero). Sem duplicidade mesmo com salvamentos simultâneos.
- token_publico: 64 caracteres hexadecimais aleatórios (2 UUIDs v4) gerados por trigger; não pode ser alterado depois.
- observacoes_admin: protegido por permissão de coluna (usuários comuns não conseguem ler a coluna); o Super Admin lê via funções admin_* que checam o papel no banco. Trigger impede dono de alterar ativo, pago_ate, slug e observacoes_admin.
- Empresa suspensa: além da tela de bloqueio, a RLS nega acesso a produtos/orçamentos etc. dessa empresa.
