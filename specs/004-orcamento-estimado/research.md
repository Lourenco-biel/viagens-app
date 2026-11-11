# Pesquisa técnica — Orçamento estimado da viagem

**Data**: 2026-11-06\
**Base**: [spec 004](spec.md) e constituição 1.0.0.\
**Resultado**: decisões técnicas fechadas para o planejamento; a implementação depende da validação de escopo prevista na constituição.

## 1. Integração na arquitetura existente

**Decisão**: manter a funcionalidade em `src/features/trips/`, com validação Zod compartilhada, persistência em `trip-service.ts`, contrato GraphQL e componentes clientes existentes.

**Justificativa**: `src/lib/graphql/schema.ts` autentica resolvers; `src/app/api/graphql/route.ts` usa a sessão Supabase do usuário, verifica origem e limita o corpo a 65.536 bytes. `TripDetails` já consulta a viagem e `Itinerary` apresenta seu custo. A documentação instalada de Next.js confirma a utilização de componentes clientes para interação e estado local.

**Alternativas consideradas**: nova rota REST, Server Action, store global ou biblioteca de formulários. Não oferecem benefício concreto para esta alteração.

**Referências locais**: `src/lib/graphql/schema.ts`, `src/lib/graphql/provider.tsx`, `src/features/trips/server/trip-service.ts` e `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`.

## 2. Precisão e transporte monetário

**Decisão**: armazenar `trips.budget_per_person` como `numeric` anulável, sem precisão/escala declaradas; exigir valor finito, não negativo e escala de no máximo duas casas por restrição. Transportar o orçamento como string decimal e usar centavos `bigint` apenas nos cálculos locais.

**Justificativa**: `numeric(p, 2)` pode arredondar antes de a restrição verificar a entrada. A representação decimal evita introduzir o teto de R$ 1.000.000,00 do passeio no orçamento ou perder centavos em valores grandes. A ausência permanece `null`. [Documentação PostgreSQL](https://www.postgresql.org/docs/current/datatype-numeric.html).

**Alternativas consideradas**: `Float`/soma decimal em JavaScript, limite baseado em `Number.MAX_SAFE_INTEGER`, inteiro SQL de tamanho fixo ou biblioteca decimal. As duas primeiras alternativas comprometem exatidão ou introduzem limite de valor; as demais são desnecessárias para soma e subtração.

**Leitura**: selecionar explicitamente as colunas necessárias da viagem, incluindo `budget_per_person::text`, em `requireTrip`; não combinar `*` e o mesmo campo convertido. Normalizar a string para duas casas sem passagem por `Number`. A projeção textual é suportada pelo [PostgREST](https://docs.postgrest.org/en/stable/references/api/tables_views.html#casting-columns) e pelo parser do cliente instalado.

**Escrita e tipos**: enviar a string decimal validada ao campo numérico pelo cliente Supabase. O helper atual `Table<Row, Insert>` já deriva `Update` de `Insert`: manter `TripRow.budget_per_person` bruto como `number | null`, omitir esse campo na derivação de `Insert` e reintroduzi-lo como `budget_per_person?: string | null`. Declarar a projeção de `requireTrip` como `string | null`, pois a inferência de cast do cliente instalado não preserva explicitamente a nulabilidade. Ajustar consumidores como `tripSummary` para receber apenas os campos utilizados. Não converter para número nem usar `any` para contornar a tipagem.

**Limites técnicos**: continuam aplicáveis o limite de corpo da rota e a capacidade do banco. Não adicionar um teto de negócio nem converter estouro ou erro de transporte em um valor aproximado.

## 3. Soma e apresentação exatas

**Decisão**: converter cada custo confirmado para centavos antes de somar, usando `BigInt(Math.round(custo * 100))` no adaptador do custo existente; converter o orçamento diretamente da string. Comparar e subtrair inteiros.

**Justificativa**: cada passeio já é validado entre zero e R$ 1.000.000,00 com duas casas; a conversão individual está na faixa segura. O arredondamento aqui adapta um valor já validado, não aceita orçamento com casas excedentes. Somar centavos como `bigint` evita limitação acumulada do total.

**Apresentação**: usar `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` com a parte inteira `bigint` em `formatToParts`, substituindo a fração pelos dois dígitos dos centavos. Não reconverter o valor completo para `Number`. Quebrar valores longos no layout.

**Compatibilidade**: o projeto tem `target: ES2017` e `lib: esnext`; usar `BigInt(...)`, sem literais como `100n`, preservando a configuração. Nenhum `bigint` deve atravessar GraphQL, JSON ou o cache Apollo.

**Verificação exploratória**: no Node.js 24.14.0 local, R$ 9.007.199.254.740.993,01 foi formatado sem perda de centavos e os custos 0,10 + 0,20 produziram 30 centavos. Isso valida a abordagem no runtime local, não substitui testes nos navegadores.

**Alternativas consideradas**: arredondar apenas depois da soma ou formatar grandes quantias como `number`; ambas deixam pontos de perda de precisão.

## 4. Autorização, migração e concorrência

**Decisão**: acrescentar uma coluna sem preenchimento retroativo e preservar RLS, grants e autorização de organizador. Os grants de `trips` já são por tabela e cobrem a nova coluna; não são necessárias concessões adicionais. A operação altera apenas `budget_per_person` da viagem identificada.

**Justificativa**: `requireOwner` já protege alterações de viagem no serviço; a política e os privilégios do banco devem continuar protegendo chamadas que não passam pelo GraphQL. Participantes consultam o campo pela mesma autorização da viagem. A atualização deve exigir retorno da linha afetada para não comunicar sucesso em alteração de zero linhas.

**Concorrência**: atualizações são atribuições atômicas de um campo. Repetir o mesmo valor ou a remoção é idempotente. Em envios concorrentes do organizador, prevalece a última gravação concluída pelo banco; não será criado versionamento de orçamento. Mudanças de nome/datas e orçamento não devem sobrescrever campos uma da outra.

**Alternativas consideradas**: tabela separada, função privilegiada e versionamento semelhante ao passeio. O orçamento não exige alteração transacional de votos ou de várias tabelas; a proteção existente de viagens é suficiente, acompanhada de testes para a nova coluna.

**Evidências do banco**: `202610260001_mvp.sql` define `trips_read`, `trips_create`, `trips_edit`, revogação de acesso anônimo e grants de tabela. `202610290001_activity_editing.sql` restringe `activities`, sem mudar os grants de `trips`. `tests/database.test.mjs` já verifica que a tentativa de um participante atualizar a viagem pode retornar zero linhas, sem exceção SQL. O trigger existente de validação do período continua executando em atualizações da viagem e não deve ser removido.

**Falha de resposta após gravação**: não apresentar sucesso sem confirmação nem inventar reversão. Manter o rascunho e permitir repetir a atribuição; a consulta posterior reconcilia o valor efetivamente salvo.

## 5. Contrato e atualização

**Decisão**: adicionar `Trip.budgetPerPerson: String` e a mutação `setTripBudget(id, input)`, com string para definir/editar e `null` explícito para remover. Campo omitido é inválido.

**Justificativa**: preserva a distinção entre ausência e zero. A mutação retorna `Trip` e utiliza o fragmento de detalhes compartilhado, incluindo orçamento e passeios. A resposta com identidade permite ao Apollo atualizar o objeto normalizado. [Documentação Apollo Client](https://www.apollographql.com/docs/react/data/mutations#updating-local-data).

**Atualização**: manter `pollInterval: 30000`, os dados remotos no Apollo e o rascunho no modal. Derivar novamente o resumo a partir da viagem recebida. Nenhuma consulta periódica adicional, resposta otimista ou subtotal persistido.

**Alternativas consideradas**: mutações independentes para cada ação ou incluir o orçamento em `TripInput`; a primeira multiplica contratos e a segunda mistura o orçamento ao formulário de dados gerais da viagem.

## 6. Modal, remoção e acessibilidade

**Decisão**: reutilizar `Dialog`, `Input`, `Button`, feedback e os padrões de `ActivityDialog`. Separar a apresentação do resumo do controlador de mutação. Usar `ConfirmButton` para confirmação explícita da remoção, com tratamento de erro e retorno de foco no controlador.

**Justificativa**: os componentes já atendem aos padrões Base UI do projeto. O rascunho é capturado ao abrir; novas respostas periódicas não devem reinicializar o campo. Envio bloqueia duplicação e fechamento, como no modal de passeio. Cancelamento anterior ao envio descarta somente o rascunho.

**Cuidados**: `ConfirmButton` não administra erros de rede ou o foco após substituir seus botões. O controlador deve capturar falhas, mostrar erro acessível, permitir nova tentativa e restaurar foco para uma ação existente. Não ampliar o componente compartilhado se a composição local resolver.

**Alternativas consideradas**: substituir modais existentes ou criar um sistema geral de formulários. Não são necessários.

## 7. Testes e evidências

**Decisão**: Jest para validação/cálculo/serviço/contrato; PGlite com papéis autenticados para migração e permissões; Playwright nos projetos `chromium` e `mobile` para interface; Storybook para estados visuais.

**Justificativa**: essas ferramentas e seus comandos já existem. Os testes de interface usam GraphQL simulado e não provam autorização no Supabase ou persistência remota. A homologação deve verificar o transporte textual PostgREST, a mutação autenticada e a consulta após recarga com duas contas.

**Ambiente de banco**: a configuração local declara PostgreSQL 17; a CI existente usa PostgreSQL 16. O desenho utiliza recursos presentes em ambos. Registrar a versão efetivamente homologada; a aprovação em PGlite/CI não equivale a validar a Data API do ambiente Supabase. Não é necessária mudança de versão para esta funcionalidade.

**Alternativas consideradas**: considerar mocks suficientes para segurança ou executar migrações remotas durante o planejamento. Nenhuma comprova adequadamente a entrega nesta etapa.

## 8. Contexto do Spec Kit

**Decisão**: manter os artefatos em `specs/004-orcamento-estimado` e a branch Git atual `codex/setup-spec-kit`.

**Justificativa**: `setup-plan.sh --json` retornou `BRANCH=004-orcamento-estimado` porque `common.sh` usa o nome do diretório quando não há contexto `SPECIFY_FEATURE`. Esse identificador não comprova criação ou troca de branch; `git branch --show-current` confirmou a branch real.

**Pendências técnicas**: nenhuma decisão aberta. A homologação de integração e os testes da futura implementação continuam planejados, não executados.
