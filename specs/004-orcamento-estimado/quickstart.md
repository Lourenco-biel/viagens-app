# Guia de validação — Orçamento estimado da viagem

## Revisão e versionamento — 2026-11-11

Gabriel solicitou revisão, organização dos commits com Conventional Commits e push da branch atual para `origin`. A revisão não identificou novos impedimentos de código. A migração continua sendo requisito antes do uso do código em cada ambiente; a homologação remota permanece atribuída ao relato de Gabriel, conforme a seção seguinte.

Nesta etapa, `npm run lint`, `npm run typecheck`, `npm test -- --runInBand` (104 testes em 11 suites), `npm run test:db` (21 testes PGlite), `git diff --check` e os links locais dos artefatos passaram. Playwright e builds não foram repetidos: o código mantém a validação de 2026-11-10, com 115 cenários aprovados e uma exclusão prevista, build Next.js e Storybook aprovados.

A entrega foi organizada por contexto:

| Commit | Contexto |
| --- | --- |
| `5505627` | Ajuste de título gerado pelo Next.js em AGENTS.md |
| `2237e1e` | Migração, validação, autorização, persistência e contrato GraphQL do orçamento, com testes |
| `c95646c` | Resumo, comparação exata, gestão do orçamento, recuperação do rascunho e testes de interface |
| `bc6bcb4` | Histórias de orçamento e fonte dos portais no Storybook |
| Commit que contém este registro | Spec 004, plano, contratos, tarefas, resultados e orientações de migração |

O push foi autorizado para `origin/codex/setup-spec-kit`, incluindo o commit de configuração do Spec Kit `681c984`, que já existia localmente. Este registro foi preparado antes do envio; a confirmação do push é informada no relatório da sessão e pode ser conferida pela referência remota. Nenhum deploy manual foi executado nesta etapa.

## Homologação manual relatada — T036/T040 — 2026-11-11

Após a orientação sobre os testes com Supabase real e o registro de evidências, Gabriel confirmou na conversa: “tudo perfeitamente testado”. A confirmação global foi registrada como conclusão manual relatada do roteiro de homologação desta funcionalidade, encerrando T036 e T040.

**Origem da evidência**: relato de Gabriel, responsável pela execução manual. O contexto da conversa foi a validação do orçamento com Supabase real e duas contas. Não foram fornecidos resultados individuais por cenário, capturas, logs de API, identificação do projeto ou versões do ambiente remoto; esses detalhes não são presumidos nem atribuídos a execução pelo assistente. Os testes automatizados locais continuam registrados separadamente e não constituem prova de integração real.

Durante a preparação, foi informado erro de envio de confirmação no cadastro. Gabriel identificou um IP bloqueado no Brevo e relatou seu desbloqueio. A confirmação global dos testes foi recebida posteriormente; não houve inspeção direta dos painéis Supabase/Brevo pelo assistente.

**Estado ao encerrar a homologação**: 40/40 tarefas concluídas, com homologação manual relatada por Gabriel. O registro e os estados da spec, plano, tarefas, índice e MVP foram atualizados. Nesta etapa houve apenas atualização documental; nenhum novo teste, comando remoto, commit, push ou deploy foi executado pelo assistente.

As seções datadas abaixo preservam o histórico e as limitações de cada execução. As referências anteriores à homologação pendente descrevem o estado daquelas datas.

## Recuperação do rascunho — T039 — 2026-11-10

Correção autorizada por Gabriel pelo pedido `$speckit-implement corrigir e testar a recuperação do rascunho`. Ambiente WSL2 (`Linux 6.18.54.1-microsoft-standard-WSL2`), Node.js 24.14.0, dependências existentes. Checklist de requisitos: 16/16 itens concluídos, sem alterações nos marcadores. Constituição, plano, contratos, ignores e documentação instalada de Server/Client Components conferidos; nenhuma dependência ou configuração adicional.

`TripDetails` mantém os dados confirmados disponíveis no Apollo e a árvore do modal quando a consulta periódica falha por rede, HTTP 5xx ou `OPERATION_FAILED`. O rascunho permanece local ao modal, inclusive após falha de salvamento e duas falhas consecutivas de atualização. O erro de atualização aparece na página e dentro do modal com `role="alert"`; a próxima leitura bem-sucedida atualiza o resumo sem substituir o preenchimento. Uma nova tentativa de salvamento utiliza o mesmo rascunho e restaura o foco ao concluir.

Falhas de autenticação, autorização ou viagem não encontrada continuam ocultando detalhes e modal. O estado de bloqueio impede que uma falha de rede posterior volte a exibir os dados antigos; uma leitura bem-sucedida libera a tela. Falhas na repetição manual da consulta são tratadas sem rejeição de promessa não capturada. O polling permanece em 30 segundos, sem store, temporizador ou cópia local dos dados remotos adicionais.

**Reprodução antes da correção**: `npx playwright test e2e/trip-budget.spec.ts --grep 'recuperação do rascunho.*network' --project=chromium` falhou porque o campo do modal deixou de existir após o polling malsucedido. Durante a correção, a regressão de `FORBIDDEN` seguido de falha de rede revelou reexibição indevida do cache; esse caso também foi corrigido antes da execução final.

| Comando / verificação após a correção | Resultado |
| --- | --- |
| `npm run lint` | Aprovado |
| `npm run typecheck` | Aprovado |
| `npm test -- --runInBand` | 104 testes aprovados em 11 suites |
| `npm run test:e2e` | 115 cenários aprovados; 1 exclusão intencional do atalho de desktop no mobile; nenhuma falha |
| `npm run build` | Aprovado, incluindo TypeScript e geração de páginas |
| `npm run build-storybook` | Aprovado; avisos de diretivas em dependências não impediram o build |
| Storybook `Viagens/BudgetDialog/FalhaNaAtualizacao` | Exercitado com Playwright no build estático: aviso, preenchimento, foco contido e salvamento; captura inspecionada em 390×400, sem overflow horizontal |
| `git diff --check` | Aprovado |

A regressão inclui 20 cenários novos nos dois projetos (`chromium` e `mobile`): falha de salvamento seguida de falhas de consulta por rede, HTTP 503 ou GraphQL; recuperação da leitura e salvamento sem redigitação; negativa de acesso por `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, HTTP 401/403/404, seguida de falha de rede e nova consulta; falha inicial com repetição. Os 56 cenários de orçamento, somando anteriores e novos, passaram dentro da suíte completa.

**Estado**: T039 concluída. T036 e T040 permanecem pendentes. Os testes de interface usam API simulada e não comprovam integração Supabase real. Banco e backend não foram alterados por esta correção; os testes de banco não foram reexecutados nesta etapa. Nenhuma migração remota, commit, push ou publicação foi realizada.

## Execução local — 2026-11-06

Escopo autorizado por Gabriel via `$speckit-implement`. Ambiente WSL, Node 24.14.0, dependências instaladas; comandos do package.json e ignores conferidos. Guia instalado de Server/Client Components consultado. Nome da migração disponível; nenhuma dependência ou configuração de runtime alterada.

Fundamentos: Jest 23 testes aprovados (modelo e helpers); PGlite 2 testes aprovados (migração sobre dados existentes, null, zero, precisão e valores especiais). Antes da implementação, confirmadas falhas por módulo/coluna ausentes. Homologação Supabase real ainda não executada.

US1: 10 testes do serviço, 22 de contrato GraphQL e 4 de banco aprovados. Playwright: 4 cenários aprovados (2 em chromium e 2 em mobile), incluindo gestão com recarga e consulta sem ações pelo participante. Falhas esperadas antes do código: mutação ausente e resumo ausente. Ajustada a configuração do mock Jest para permitir testes dos resolvers; não houve alteração de dependências. A recarga usa dados do servidor simulado, não comprova PostgREST remoto.

US2: 12 testes de cálculo aprovados. Os 22 cenários acumulados de Playwright passaram após corrigir no teste o listener de confirmação da edição equivalente e repetir três falhas (duas do listener e um timeout de ambiente). Sete histórias do resumo verificadas no Storybook a 390 px, sem overflow; captura visual da quantia longa inspecionada. Polling, reabertura, edição equivalente/efetiva, reconfirmação, remoção e ações acima do orçamento cobertos com API simulada.

**Estado**: implementação e validação local concluídas. Homologação real pendente (T036). Sem commit, push ou deploy; as seções seguintes orientam a homologação.

### Regressão integrada

Em 2026-11-06: lint e typecheck aprovados; Jest completo inicialmente com 101 testes; banco completo com 21 testes aprovados, incluindo instalação nova e migração sobre dados anteriores. Três casos adicionais de rejeição de quebras de linha na entrada da API foram conferidos, totalizando 24 casos no teste do modelo.

Playwright completo executou 96 cenários: 92 passaram, 3 falharam e 1 foi ignorado por ser atalho exclusivo de desktop no projeto mobile. As falhas expuseram uma corrida de foco na remoção (desktop/mobile) e um timeout de navegação no login mobile. A restauração de foco agora aguarda o commit que habilita o botão; o código de autenticação foi preservado. A repetição de todos os cenários de orçamento e autenticação passou: 44/44, incluindo os três que falharam, o salvamento integral por teclado e a remoção do último passeio confirmado. Resultado consolidado: 95 cenários distintos aprovados e 1 exclusão intencional, sem falhas pendentes.

As capturas do modal e do resumo em viewport 390×400 foram inspecionadas. O ajuste de fonte da prévia Storybook cobre também os portais de modal. O Next dev regenerou automaticamente o nível do título no bloco gerado de `AGENTS.md`; as instruções foram preservadas.

Conferência final após as correções:

| Comando / verificação | Resultado |
| --- | --- |
| `npm run lint` | Aprovado |
| `npm run typecheck` | Aprovado |
| `npm test -- --runInBand` | 104 testes aprovados em 11 suites |
| `npm run test:db` | 21 testes aprovados |
| `npm run test:e2e` e `npx playwright test e2e/trip-budget.spec.ts e2e/auth.spec.ts` | 95 cenários distintos aprovados após correção e repetição; 1 ignorado intencionalmente no mobile |
| `npm run build` | Build Next.js concluído, incluindo TypeScript e geração das páginas |
| `npm run build-storybook` | Build concluído; avisos do Vite sobre diretivas `use client` em dependências, sem impedir a geração |
| Storybook | 14 histórias novas exercitadas; modal do build estático conferido após o ajuste da fonte nos portais |
| `git diff --check` e links locais dos artefatos | Aprovados |

Uma execução intermediária de typecheck coincidiu com a regeneração dos arquivos `.next-e2e/dev/types` e encontrou arquivo temporariamente ausente. As verificações finais foram executadas depois do encerramento do servidor E2E e passaram. Nenhuma alteração de configuração TypeScript foi necessária.

### Integração real e concorrência

T036 permanece pendente: não foi disponibilizado um ambiente Supabase de homologação com duas contas de teste. Supabase CLI, Docker e `psql` não estão no PATH; `DATABASE_TEST_URL` e `PSQL_PATH` não estão configurados. Nenhuma migração foi aplicada ao projeto remoto e nenhum dado remoto foi alterado.

A suite adicional de concorrência com conexões PostgreSQL independentes não foi executada. RPC de edição, controle de versão, votos e transações existentes permanecem inalterados. Os testes PGlite validam constraints, RLS, migrações e preservação de dados, mas não substituem essa suite nem a homologação PostgREST/cookies.

### Cobertura revisada

| Requisitos e critérios | Evidência local | Limite |
| --- | --- | --- |
| FR-001, FR-005, FR-006; SC-001 | Migração com dados anteriores e instalação nova; serviço; gestão e recarga no Playwright | Recarga E2E usa API simulada; persistência via Supabase real pendente |
| FR-002, FR-003; SC-002 | Autenticação e contrato GraphQL; autorização do serviço; RLS real no PGlite para organizador, participante, externo, removido e anônimo | Transporte HTTP autenticado e Data API reais pendentes |
| FR-004 | 24 casos Zod; constraints SQL; validação de formulário, zero, precisão e quantia grande | Cast textual via PostgREST real pendente |
| FR-007–FR-011; SC-003–SC-005 | 12 testes de helpers; matriz de comparação em desktop/celular; ausência, centavos e participantes | Valores preparados localmente; cálculos exatos independem de integração externa |
| FR-012–FR-014; SC-006, SC-009 | Sugestão, voto e confirmação acima do limite; edição equivalente/efetiva, reabertura, reconfirmação e remoção; polling de 30 s com relógio controlado | Atualização entre duas contas reais pendente |
| FR-015–FR-018, FR-020; SC-007, SC-008 | Modal, teclado, foco, envio, validação, falha/repetição, resposta perdida, rascunho durante polling e viewport baixo; Storybook | Erros de rede/persistência induzidos em ambiente simulado |
| FR-019; SC-008 | Remoção com confirmação/cancelamento, falha, retorno de foco; comparação dos passeios/votos/versões/membros/convites antes e depois no banco | Homologação integrada pendente |

A cobertura acima registra evidências por camada; não declara homologação apenas com base nos mocks. As instruções para concluir os cenários reais seguem abaixo.

US3: 14 cenários de Playwright aprovados, incluindo recuperação após gravação com resposta perdida, preservação de rascunho no polling, descarte por quatro formas, envio lento, teclado e viewport 390×400. O teste detectou perda de foco ao iniciar a confirmação de remoção; corrigido no controlador. Ajustado o seletor de erro do teste para excluir o anunciador de rota do Next. Seis histórias do modal e o fluxo de remoção com falha/repetição verificados com Playwright no Storybook; captura do modal em viewport baixo inspecionada. Uma primeira tentativa de inspeção ocorreu antes de o Storybook estar pronto; repetida após inicialização, com sucesso.

**Referências**: [plano](plan.md), [modelo](data-model.md), [GraphQL](contracts/graphql.md) e [interface](contracts/interface.md).

## 1. Pré-requisitos

- WSL/Linux, Node.js 24 e npm, conforme o README.
- Dependências do projeto e navegador Chromium do Playwright instalados.
- Portas 3100 e 54329 disponíveis para Playwright; 6006 para Storybook.
- Para homologação real: ambiente Supabase de validação, migrações aplicadas, configuração local preservada e duas contas com sessão válida: organizador e participante.
- Uma viagem de teste com participantes, passeios confirmados/em votação e votos. Usar dados descartáveis no ambiente de validação.

Na raiz do projeto, quando necessário:

```bash
cd /home/gabriel/projects/viagens-app
npm ci
npx playwright install chromium
```

Não sobrescrever um `.env.local` existente. Para ambiente ainda não configurado, seguir [README](../../README.md). Os testes simulados usam sua própria configuração e não precisam acessar o Supabase remoto.

## 2. Verificações locais focadas

Após criar os arquivos previstos no plano:

```bash
npm test -- --runInBand src/features/trips/model/trip-budget.test.ts src/features/trips/lib/trip-costs.test.ts src/features/trips/server/trip-budget.test.ts src/lib/graphql/schema.test.ts
node --test tests/trip-budget.test.mjs
npm run test:e2e -- e2e/trip-budget.spec.ts --project=chromium --project=mobile
```

Resultados esperados:

- Validação recusa vazio, negativo, texto, mais de duas casas, propriedade omitida e valores especiais; aceita zero, inteiros e até duas casas.
- Cálculos produzem os resultados da matriz da seção 4 e não utilizam quantidade de participantes.
- Contrato, autorização e serviço rejeitam alterações indevidas e nunca comunicam sucesso com zero linhas alteradas.
- Testes de banco exercitam as políticas reais com papéis autenticados e preservam os dados anteriores à migração.
- Playwright cobre sucesso, cancelamento, falha/repetição, envio, teclado, responsividade e atualização do resumo. O servidor de teste é iniciado pela configuração existente.

## 3. Regressão e documentação visual

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run test:db
npm run test:e2e
npm run build
npm run build-storybook
```

Conferir as histórias novas em:

```bash
npm run storybook
```

Abrir `http://localhost:6006`. Verificar os estados indicados no [contrato de interface](contracts/interface.md), incluindo ausência, zero, excesso, envio, erro e quantia longa.

O teste de concorrência existente de passeios pode ser executado como regressão quando os caminhos de viagem/passeio compartilhados forem afetados. Requer PostgreSQL local e banco vazio exclusivo chamado `viagens_activity_test`:

```bash
npm run test:db:concurrency
```

Configurar previamente `DATABASE_TEST_URL` conforme o README; não apontar esse teste para um projeto Supabase real. Registrar a versão de PostgreSQL utilizada.

## 4. Matriz de comportamento

| Preparação | Ação | Resultado esperado |
| --- | --- | --- |
| Viagem existente sem orçamento | Consultar como organizador e participante | Total visível; ausência informada; sem saldo/excesso; ação de definição só para organizador |
| Sem orçamento | Organizador define R$ 500,00 e recarrega | Valor salvo permanece |
| Orçamento R$ 500,00 | Editar para R$ 600,50 e recarregar | Novo valor permanece |
| Orçamento R$ 500,00; confirmados R$ 320,00 | Consultar | R$ 180,00 restantes |
| Orçamento R$ 500,00; confirmados R$ 550,00 | Consultar | Aviso com R$ 50,00 excedidos |
| Orçamento R$ 500,00; confirmados R$ 500,00 | Consultar | Limite atingido |
| Orçamento R$ 0,00; total zero | Consultar | Limite atingido, edição e remoção disponíveis |
| Orçamento R$ 0,00; confirmado R$ 20,00 | Consultar | R$ 20,00 excedidos |
| Orçamento R$ 0,30; confirmados R$ 0,10 e R$ 0,20 | Consultar | Limite atingido sem diferença residual |
| Orçamento R$ 500,00; somente sugestões pagas | Consultar | Total zero e R$ 500,00 restantes |
| Mesmo roteiro e orçamento | Alterar quantidade de participantes | Nenhum valor por pessoa muda |
| Orçamento excedido | Sugerir, votar e confirmar com permissões válidas | Operações continuam permitidas |
| Passeio confirmado | Editar efetivamente e depois confirmar novamente | Sai do total na reabertura e retorna com novo custo |
| Último passeio confirmado | Excluir ou reabrir | Total volta a zero e comparação acompanha |
| Orçamento definido e passeio com votos | Cancelar remoção; depois confirmar e recarregar | Cancelar preserva; confirmar retira só orçamento; passeios/custos/votos permanecem |
| Modal preenchido | Cancelar, Escape, fechar ou clicar fora e confirmar descarte | Nenhuma gravação |
| Modal com entrada inválida | Salvar | Mensagem de campo; dado salvo intacto |
| Salvamento pendente | Tentar novo envio ou fechar | Sem duplicação ou fechamento durante envio |
| Falha de gravação simulada antes da persistência | Salvar e tentar novamente | Rascunho preservado; erro acessível; nova tentativa funciona |
| Gravação concluída com falha na resposta | Receber erro, aguardar próxima consulta e repetir | Sem anúncio de sucesso indevido; rascunho preservado; leitura reconcilia o valor; repetição idempotente não altera o roteiro |
| Falha de remoção simulada | Confirmar | Última informação confirmada preservada; erro e nova tentativa |
| Modal aberto e preenchido | Receber atualização periódica | Resumo atualiza; rascunho não é substituído |
| Duas sessões abertas | Alterar orçamento/passeios na sessão autorizada | Outra sessão atualiza no próximo ciclo bem-sucedido de 30 segundos |
| Desktop, celular e viewport baixo | Executar fluxos por teclado | Campo, ações e mensagens alcançáveis; foco contido e restaurado |

Em teste automatizado do polling, usar relógio controlado ou espera pela requisição para verificar um ciclo de 30 segundos; não criar esperas fixas desnecessárias.

## 5. Migração e autorização em banco

Em `tests/trip-budget.test.mjs`, usar os padrões PGlite existentes:

1. Aplicar todas as migrações sobre banco vazio e criar viagem sem orçamento; esperar `NULL`.
2. Aplicar as duas migrações antigas, inserir viagem, membros, convite, passeios e votos, guardar o estado e aplicar somente a nova migração.
3. Conferir orçamento `NULL` e igualdade dos demais registros antes/depois.
4. Executar definição, edição e remoção como organizador; verificar outra viagem, passeios, versões, votos, membros e convites inalterados.
5. Tentar alterar como participante, externo, membro removido e anônimo. Aceitar a forma de rejeição da RLS, incluindo zero linhas afetadas, mas exigir valor persistido inalterado.
6. Testar consulta permitida para membros e negada para quem perdeu acesso.
7. Testar a constraint diretamente, inclusive `1.001`, `1.230`, valores negativos, `NaN` e infinitos; não depender de Zod.
8. Conferir exatamente `9007199254740993.01` na leitura textual, além de valores superiores ao limite de custo de um passeio.
9. Verificar que a edição geral de nome/datas preserva orçamento e que editar orçamento preserva os dados gerais.

PGlite valida regras SQL, não a conversão HTTP do PostgREST nem cookies de sessão.

## 6. Homologação real com duas contas

Em ambiente de validação autorizado, aplicar somente a migração nova depois das anteriores, conforme o README. Não reaplicar a migração inicial. A aplicação nova deve ser iniciada apenas após a coluna existir.

```bash
npm run dev
```

Com organizador e participante em navegadores/perfis distintos:

1. Executar definição, edição e remoção pela interface e verificar recarga e atualização na outra sessão.
2. Usar o exemplo de mutação do [contrato GraphQL](contracts/graphql.md) com a sessão do participante. Exigir `FORBIDDEN` e dado intacto; repetir com string e `null`.
3. Verificar leitura do orçamento como string com duas casas, incluindo zero e valor acima da precisão inteira segura do JavaScript. O valor não pode ser aproximado ao voltar do Supabase.
4. Verificar a Data API diretamente, pois a negação no GraphQL não prova a RLS.
5. Repetir os principais cenários da matriz; registrar limitações de rede e ambiente.

Para o teste direto da Data API, definir localmente `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ACCESS_TOKEN` e `TRIP_ID` do ambiente de validação. Usar token de usuário, nunca chave privilegiada. Não registrar tokens nas evidências.

Leitura textual:

```bash
curl --fail-with-body --get "$SUPABASE_URL/rest/v1/trips" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --data-urlencode "id=eq.$TRIP_ID" \
  --data-urlencode "select=id,budget_per_person::text"
```

Tentativa de escrita na viagem de teste:

```bash
curl --fail-with-body --request PATCH "$SUPABASE_URL/rest/v1/trips?id=eq.$TRIP_ID" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  --data '{"budget_per_person":"9007199254740993.01"}'
```

Como organizador, conferir o valor exato pela leitura textual. A resposta numérica bruta do PATCH não deve ser usada como prova da precisão no cliente JavaScript. Como participante, tentar outro valor e `null`: a resposta pode ser uma lista vazia por RLS; conferir em seguida, como organizador, que nada mudou. Pessoa externa não deve obter a linha na consulta.

Depois do teste com valor grande, restaurar ou remover o orçamento da viagem de teste pela interface. Não usar dados de uma viagem real para essas verificações.

## 7. Registro e ordem de entrega

Registrar por comando: data, ambiente, versão, resultado e limitações. Separar revisão documental, testes unitários, banco local, interface simulada e homologação real.

Atualizar `docs/mvp.md` com as regras efetivamente entregues e a referência correta à edição de passeios; atualizar `docs/specs/README.md` e o README com a migração. Entregar migração antes do código. Registrar commits, envio e publicação apenas quando efetivamente realizados.
