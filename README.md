# Viagens

Planejamento de viagens individuais e em grupo. MVP com contas, viagens persistidas, convites, roteiro e votação.

## Stack

Next.js App Router e TypeScript; Tailwind e shadcn/ui (Base UI); GraphQL Yoga no servidor; Apollo Client no navegador; Supabase Auth e PostgreSQL; Zod; Jest, Playwright e Storybook.

## Rodar no WSL

Node.js 24 e npm. Execute na pasta do projeto:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Preencha o ambiente conforme as etapas abaixo. Sem configuração, a aplicação mostra uma tela de indisponibilidade; os mocks são exclusivos de testes e Storybook.

## Preparar o Supabase

1. Crie um projeto no Supabase e guarde a senha do banco em local seguro. Mantenha **Enable Data API** e **Enable automatic RLS** ativos; desative **Automatically expose new tables**, pois a migração concede as permissões explicitamente.
2. No SQL Editor, execute o conteúdo de `supabase/migrations/202610260001_mvp.sql` **uma vez, em um projeto novo**. A migração cria as tabelas, funções, triggers e políticas RLS.
3. Copie a URL do projeto e a chave **publishable** (ou a antiga chave anon) para `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Em **Authentication → Sign In / Providers → Email**, mantenha o provedor Email habilitado e configure **Minimum password length** como 8. Mantenha também **Confirm email** ativo na página de provedores.
5. Em **Authentication → URL Configuration**, use `http://localhost:3000` como Site URL e permita `http://localhost:3000/**` nas Redirect URLs para desenvolvimento local.
6. Configure SMTP para enviar confirmações e recuperação de senha aos usuários reais. Verifique os limites de envio do seu provedor.
7. Reinicie o servidor, crie uma conta e confirme o e-mail no mesmo navegador usado no cadastro.

Não use chave secret/service_role no navegador ou neste app. A API usa a sessão do usuário, e as políticas do banco decidem o acesso. Não comite `.env.local`.

Se o ambiente já estiver configurado, preserve o arquivo `.env.local` existente. O aplicativo está publicado na Vercel, conectado ao Supabase remoto e com SMTP Brevo configurado. Os resultados relatados por Gabriel estão registrados em [docs/validacao-mvp.md](docs/validacao-mvp.md).

Alternativa com Supabase CLI: após instalar e autenticar a CLI, use `supabase link --project-ref SEU_PROJECT_REF` e `supabase db push` no projeto novo. Use somente uma forma de aplicar a migração. A configuração local está em `supabase/config.toml`; `supabase start` exige Docker.

## Validação

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run test:db
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
npm run build-storybook
```

- Jest: regras de datas, busca, validação e contrato dos documentos GraphQL.
- Banco: PostgreSQL real em memória via PGlite, com a migração e papéis autenticados, sem projeto remoto.
- Playwright: fluxos desktop e celular, com servidor de autenticação de teste e respostas GraphQL simuladas. Também verifica proteção real da rota GraphQL contra consultas anônimas e origens externas.
- Esses testes não substituem a homologação do Supabase remoto: cookies, envio de e-mail, PostgREST e persistência precisam ser conferidos com o projeto configurado.
- Playwright usa portas 3100 e 54329, com saída em `.next-e2e`. Não precisa alterar seu ambiente real.

## Storybook

```bash
npm run storybook
```

Abra `http://localhost:6006`. Há histórias para cards, estados vazios, criação de viagem, sugestões e acesso.

## Publicação

1. Configure e homologue o Supabase antes de publicar.
2. Suba o repositório para o GitHub e importe o projeto na Vercel, ou use outro host compatível com Next.js no servidor. Não use exportação HTML estática.
3. Configure as duas variáveis de ambiente **antes do build**, inclusive em produção.
4. Use Node.js 24 e os comandos `npm run build` / `npm run start`.
5. No Supabase, altere o Site URL para o domínio HTTPS e adicione `https://SEU_DOMINIO/auth/callback?next=**` às Redirect URLs. O formulário inclui o destino no parâmetro `next`; o callback valida esse destino antes de redirecionar. Preserve `http://localhost:3000/**` para desenvolvimento local.
6. Refaça o build se mudar variáveis `NEXT_PUBLIC_*`.
7. Teste o checklist de homologação em [docs/mvp.md](docs/mvp.md).

Aplicativo publicado: [Viagens App](https://viagens-app-three.vercel.app/). As variáveis de conexão ficam na Vercel, e a credencial SMTP fica no Supabase; não são armazenadas no repositório.

## Próximas alterações

Especificações ficam em [docs/specs](docs/specs/README.md), com um arquivo por alteração. Use o [modelo](docs/specs/TEMPLATE.md) para definir escopo, regras, impactos técnicos e critérios de aceite antes de implementar. Documentar uma proposta não amplia automaticamente o escopo do MVP.

## Organização

```text
src/app/                     rotas, layouts e endpoint GraphQL
src/features/auth/           sessão, formulários e proteção de páginas
src/features/trips/
  components/                interface e integração com Apollo
  graphql/                   operações tipadas
  hooks/                     estado do formulário
  lib/                       funções de domínio
  model/                     tipos e schemas Zod
  server/                    serviços e persistência
src/lib/graphql/             schema, contexto, provider e erros
src/lib/supabase/            clientes SSR/browser e tipos do banco
src/components/ui/          componentes shadcn
supabase/migrations/        estrutura e permissões do banco
tests/                      testes SQL
e2e/                        testes de navegador e serviços simulados
```

Regras e limites do MVP: [docs/mvp.md](docs/mvp.md).
