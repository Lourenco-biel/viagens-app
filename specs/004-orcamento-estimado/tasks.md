# Tarefas: Orçamento estimado da viagem

**Entrada**: artefatos de `specs/004-orcamento-estimado/`.
**Data**: 2026-11-06.
**Status**: 40/40 tarefas concluídas. T039 validada localmente em 2026-11-10; T036 e T040 concluídas com base na confirmação global de homologação manual relatada por Gabriel em 2026-11-11. Origem e limitações das evidências registradas em [quickstart.md](quickstart.md). Implementação versionada nesta branch; envio ao origin autorizado por Gabriel em 2026-11-11. Nenhum deploy manual executado nesta etapa.

**Pré-requisitos**: [plano](plan.md), [spec](spec.md), [pesquisa](research.md), [modelo de dados](data-model.md), [contrato GraphQL](contracts/graphql.md), [contrato de interface](contracts/interface.md) e [guia de validação](quickstart.md).

**Testes**: incluídos conforme os princípios III e V da constituição e o plano aprovado para elaboração. Testes de comportamento devem ser escritos antes do código correspondente e demonstrar a falha esperada; testes já existentes devem continuar passando. Não considerar uma falha de infraestrutura como evidência de comportamento ausente.

**Organização**: seis fases originais e uma fase de convergência, com uma fase para cada história da spec. US1 e US2 têm prioridade P1; US3 tem prioridade P2. Todas são necessárias para concluir a funcionalidade.

## Formato e convenções

- Cada tarefa utiliza checkbox, ID sequencial, marcador opcional `[P]`, história quando aplicável e caminhos exatos.
- `[P]` indica trabalho que pode ocorrer em paralelo com arquivos distintos, somente depois de concluídas suas dependências; não autoriza iniciar uma tarefa antecipadamente.
- Caminhos de código são relativos à raiz do repositório. Arquivos novos serão criados durante a implementação.
- As tarefas T001–T002 registram pré-condições. Se uma autorização posterior de Gabriel já cobrir o escopo, registrá-la sem pedir novamente; esta geração de tarefas não registra aprovação inexistente.
- Marcar uma tarefa somente após concluir seu trabalho e sua verificação. Checkpoints são critérios de conclusão, não novas tarefas.
- A documentação de validação é `specs/004-orcamento-estimado/quickstart.md`; distinguir sempre resultados simulados, banco local e integração real.

## Fase 1 — Preparação

**Objetivo**: registrar o escopo autorizado e confirmar o ambiente existente, sem recriar o projeto.

- [X] T001 Registrar a validação de escopo por Gabriel em `specs/004-orcamento-estimado/spec.md` e refletir o status em `docs/specs/README.md` quando essa validação for fornecida; não inferir aprovação de implementação da geração deste arquivo.
- [X] T002 Conferir os pré-requisitos de `specs/004-orcamento-estimado/quickstart.md`, os comandos em `package.json`, a disponibilidade do nome da migração e a documentação instalada `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`; registrar ambiente e limitações no quickstart, preservando configuração e dependências existentes.

## Fase 2 — Fundamentos compartilhados

**Objetivo**: disponibilizar persistência, validação e operações monetárias reutilizadas pelas três histórias.

**Bloqueio**: concluir esta fase antes de integrar histórias. Os testes incluídos decorrem dos princípios III e V da constituição e da estratégia de validação do plano.

- [X] T003 [P] Criar testes de entrada em `src/features/trips/model/trip-budget.test.ts`: propriedade obrigatória anulável, zero, inteiros, uma/duas casas, zeros à esquerda, `null` explícito, vazio, omissão, negativos, expoente, separador de milhar, número JSON, `1.001`, `1.230` e `9007199254740993.01`; verificar normalização textual exata e registrar a falha esperada antes de T006.
- [X] T004 [P] Criar `tests/trip-budget.test.mjs` com PGlite para instalação nova e migração sobre viagens, membros, convites, passeios e votos anteriores; testar `NULL` inicial, zero, escala, valores especiais e leitura textual exata, comparando os demais registros antes/depois; confirmar falha por ausência da nova coluna antes de T005.
- [X] T005 Criar `supabase/migrations/202611060001_trip_budget.sql` com `budget_per_person` como “`numeric`, anulável, sem precisão/escala declaradas”; aplicar literalmente “Valor finito: excluir `NaN`, `Infinity` e `-Infinity` explicitamente.”, “Valor maior ou igual a zero.” e “`scale(budget_per_person) <= 2`.”; permitir `NULL`, sem default zero, backfill ou teto adicional, preservando RLS, grants, trigger de período e migrações anteriores.
- [X] T006 Implementar o schema Zod e o tipo de entrada em `src/features/trips/model/trip-budget.ts`, exigindo `budgetPerPerson` presente como string válida ou `null`; normalizar para duas casas sem `Number` nem arredondamento. Atualizar `src/lib/supabase/database.types.ts` para linha bruta `number | null` e escrita opcional `string | null`, `src/features/trips/model/trip-detail.ts` para “campo presente nos detalhes” como `string | null` e `e2e/support/fixtures.ts` com `budgetPerPerson: null`.
- [X] T007 Criar primeiro os testes de conversão/formatação e soma em `src/features/trips/lib/trip-costs.test.ts`, reproduzir sua falha e implementar os helpers compartilhados em `src/features/trips/lib/trip-costs.ts`: orçamento textual para centavos `BigInt`, cada custo existente convertido antes da soma, somente `confirmed` incluído e `proposed` excluído, zero sem confirmados e formatação BRL exata com `formatToParts`; verificar 0,10 + 0,20 e valor grande sem literais bigint, mudança de tsconfig ou serialização de bigint.

**Checkpoint**: Executar os testes de modelo/helpers e `node --test tests/trip-budget.test.mjs`; migração aditiva, ausência distinta de zero e operações monetárias exatas devem passar.

## Fase 3 — US1: Gerenciar o orçamento da viagem (Prioridade: P1)

**Objetivo**: permitir definir, editar e remover o orçamento pelo organizador, com consulta pelos participantes.

**Teste independente**: em uma viagem de teste, salvar R$ 500,00, editar para R$ 600,50, cancelar e confirmar remoção, recarregando após cada sucesso; como participante, consultar sem ações e comprovar rejeição de alterações no GraphQL e no banco.

### Testes da história

- [X] T008 [P] [US1] Ampliar `src/lib/graphql/schema.test.ts` com o contrato `setTripBudget`, consulta de `budgetPerPerson`, autenticação, coerção de número JSON, propriedade omitida, string/null, validação dos documentos e resolver de campo que diferencia `undefined` de `null`, incluindo solicitação do campo pela listagem.
- [X] T009 [P] [US1] Criar `src/features/trips/server/trip-budget.test.ts` para sucesso do organizador, recusa de participante, viagem invisível, UUID inválido, escrita apenas de `budget_per_person`, leitura via `::text`, zero linhas afetadas e erros seguros específicos de orçamento; verificar retorno dos detalhes e preservação do orçamento ao editar dados gerais da viagem.
- [X] T010 [P] [US1] Ampliar `tests/trip-budget.test.mjs` com definição/edição/remoção idempotentes, consulta e alteração direta por organizador, participante, externo, membro removido e anônimo; considerar rejeição por zero linhas e verificar persistência intacta, outra viagem preservada, ausência de efeitos em passeios/votos/versões/membros/convites e compatibilidade com atualização de nome/datas.
- [X] T011 [P] [US1] Criar `e2e/trip-budget.spec.ts` com o fluxo de gestão e consulta: vazio inicial, edição preenchida, zero definido, recarga, cancelar/confirmar remoção, ações ausentes para participante e preservação do roteiro; usar os contratos do mock previsto em T015 sem confundir essa evidência com autorização real.
### Implementação e verificação

- [X] T012 [US1] Implementar leitura textual e `setTripBudget` em `src/features/trips/server/trip-service.ts`: selecionar colunas explícitas com `budget_per_person::text`, preservar nulabilidade na projeção, adequar os campos exigidos por `tripSummary`, validar com Zod, exigir organizador, atualizar somente orçamento e exigir linha retornada; retornar detalhes e mapear `BAD_USER_INPUT`, `FORBIDDEN`, `NOT_FOUND` e `OPERATION_FAILED` sem reutilizar erro de período do passeio.
- [X] T013 [US1] Adicionar `Trip.budgetPerPerson: String`, `TripBudgetInput` e `setTripBudget(id: ID!, input: TripBudgetInput!): Trip!` em `src/lib/graphql/schema.ts`; manter autenticação, resolver o campo a partir de detalhe autorizado quando ausente e preservar `null` como resposta válida, sem mudar proteções da rota.
- [X] T014 [US1] Adicionar `SET_TRIP_BUDGET` tipado e `budgetPerPerson` em `TripDetailFields` de `src/features/trips/graphql/documents.ts`, reutilizando o fragmento completo na resposta e mantendo a listagem atual sem nova seleção de orçamento; comprovar que todas as mutações existentes de detalhes continuam válidas.
- [X] T015 [P] [US1] Implementar a operação simulada `SetTripBudget` em `e2e/support/fixtures.ts` com string/null, preservação do valor entre consultas/recargas, retorno de detalhes e recusa de participante; manter orçamento em todas as respostas existentes e os comportamentos de passeios.
- [X] T016 [P] [US1] Criar a apresentação básica `src/features/trips/components/trip-cost-summary.tsx` para orçamento definido ou ausente, total confirmado sempre visível e identificação “Estimativas por pessoa · somente passeios”; receber valores e ações por propriedades, restringindo controles ao organizador e tratando zero como definido, sem acrescentar ainda os estados comparativos de US2.
- [X] T017 [P] [US1] Criar `src/features/trips/components/budget-dialog.tsx` com Dialog/Input/Button existentes, campo textual com teclado decimal, vazio na definição e valor salvo na edição; normalizar vírgula/ponto conforme contrato, validar pelo schema, oferecer salvar/cancelar, informar envio/erro e conservar preenchimento até sucesso, com callbacks independentes do Apollo.
- [X] T018 [US1] Criar `src/features/trips/components/trip-budget.tsx` para consultar o orçamento pela viagem recebida, executar a mutação sem resposta otimista, abrir o modal e compor resumo/ConfirmButton; enviar `null` somente após confirmação de remoção, tratar rejeições, anunciar sucesso e preservar a última informação confirmada em falha, sem store ou temporizador adicional.
- [X] T019 [US1] Integrar `TripBudget` no lugar do bloco de custo em `src/features/trips/components/itinerary.tsx`, usando os helpers compartilhados e preservando ações do roteiro; executar os testes de US1 definidos no quickstart e registrar resultados e limites da recarga simulada em `specs/004-orcamento-estimado/quickstart.md`.

**Checkpoint**: US1 oferece uma fatia funcional de gestão e consulta. Comparação completa pertence a US2; acabamento e casos de interação de US3 ainda são necessários para entregar toda a spec.

## Fase 4 — US2: Comparar orçamento e passeios confirmados (Prioridade: P1)

**Objetivo**: apresentar restante, limite atingido ou excesso usando somente passeios confirmados por pessoa.

**Teste independente**: preparar viagens com orçamento ausente, zero e R$ 500,00; validar totais R$ 320,00, R$ 500,00 e R$ 550,00, além de R$ 0,10 + R$ 0,20 contra R$ 0,30. Alterar status, custos e participantes para conferir atualização e exclusões.

### Testes da história

- [X] T020 [P] [US2] Ampliar `src/features/trips/lib/trip-costs.test.ts` com estados “`undefined`”, “`remaining`”, “`reached`” e “`exceeded`” do modelo; cobrir 500/320/180, 500/550/50, 500/500, ausência sem saldo, zero/zero, zero/20, nenhum confirmado, centavos exatos, valor grande e invariância da comparação à quantidade de participantes e a passeios em votação.
- [X] T021 [P] [US2] Ampliar `e2e/trip-budget.spec.ts` com a matriz de comparação, mutações locais e atualização periódica recebida em 30 segundos usando relógio/requisição controlados; cobrir confirmação, remoção do último confirmado, reabertura, edição efetiva e equivalente, reconfirmação com custo novo e liberdade de sugerir/votar/confirmar acima do limite.
### Implementação e verificação

- [X] T022 [US2] Implementar a comparação derivada em `src/features/trips/lib/trip-costs.ts`, com discriminantes literais `undefined`, `remaining`, `reached` e `exceeded`; retornar ausência sem diferença e valores positivos de restante/excesso, comparar centavos exatos sem incluir participantes e sem persistir resultados.
- [X] T023 [US2] Completar `src/features/trips/components/trip-cost-summary.tsx` com os quatro estados do contrato: ausência sem saldo/excesso, restante, mensagem de limite atingido e aviso textual de excesso; exibir reais com duas casas e preservar a identificação de estimativas por pessoa somente de passeios.
- [X] T024 [US2] Conectar a comparação aos dados recebidos em `src/features/trips/components/trip-budget.tsx`, recalculando após respostas de orçamento/passeios e polling existente de `src/features/trips/components/trip-details.tsx`; não duplicar orçamento em estado local, serializar bigint, bloquear o roteiro por excesso ou adicionar polling.
- [X] T025 [US2] Criar `src/features/trips/components/trip-cost-summary.stories.tsx` para ausência como organizador/participante, restante, limite, excesso, zero e quantia longa, usando propriedades locais e ações simuladas sem rede.
- [X] T026 [US2] Executar Jest de `src/features/trips/lib/trip-costs.test.ts` e os cenários US2 de `e2e/trip-budget.spec.ts` em chromium/mobile; conferir as histórias do resumo e registrar resultados, incluindo atualização por polling e preservação das regras de voto, em `specs/004-orcamento-estimado/quickstart.md`.

**Checkpoint**: Os quatro estados devem ser verificáveis com dados preparados, sem usar o formulário de gestão como pré-requisito de cada teste.

## Fase 5 — US3: Preencher e corrigir o orçamento com segurança (Prioridade: P2)

**Objetivo**: concluir os fluxos com validação acessível, preservação de rascunho, recuperação de falhas e uso por teclado/celular.

**Teste independente**: abrir o modal com orçamento preparado e simular entrada inválida, envio lento, erro e nova tentativa; cancelar por todas as formas, testar remoção malsucedida e executar o fluxo por teclado em desktop/celular e viewport baixo.

### Testes da história

- [X] T027 [US3] Ampliar `e2e/trip-budget.spec.ts` com entradas válidas/invalidas, vírgula/ponto, falha/repetição, resposta lenta sem envio duplicado, descarte por cancelar/Escape/fechar/clique externo, preservação do rascunho durante polling, foco inicial/contido/restaurado e mensagens acessíveis; incluir remoção com falha e quantia longa em viewport baixo.
### Implementação e verificação

- [X] T028 [P] [US3] Completar o ciclo do formulário em `src/features/trips/components/budget-dialog.tsx`: confirmar descarte alterado, impedir fechamento/envio duplicado durante gravação, preservar snapshot/rascunho quando props mudarem, associar erros ao campo e permitir correção ou repetição sem redigitação; usar os testes T027 para demonstrar os comportamentos ainda ausentes.
- [X] T029 [US3] Concluir acessibilidade e layout de `src/features/trips/components/budget-dialog.tsx`: foco inicial no campo, Tab/Shift+Tab contidos, nome de fechamento, título/descrição, foco visível, retorno ao acionador equivalente após sucesso/cancelamento e altura limitada com rolagem; validar celular e viewport baixo sem ocultar ações.
- [X] T030 [P] [US3] Completar remoção e feedback em `src/features/trips/components/trip-budget.tsx` e responsividade em `src/features/trips/components/trip-cost-summary.tsx`: impedir repetição, capturar rejeições da confirmação, manter orçamento confirmado em falha, permitir nova tentativa e restaurar foco após cancelar/concluir remoção; quebrar quantias longas sem depender apenas de cor para avisos.
- [X] T031 [P] [US3] Criar `src/features/trips/components/budget-dialog.stories.tsx` com definição, edição, zero, validação, envio pendente e erro seguido de nova tentativa; demonstrar o modal com callbacks locais, sem dependência de GraphQL ou Supabase.
- [X] T032 [P] [US3] Ampliar `src/features/trips/components/trip-cost-summary.stories.tsx` com demonstração de confirmação/cancelamento de remoção, envio e falha recuperável, utilizando composição local dos controles existentes e mantendo as histórias comparativas de US2.
- [X] T033 [US3] Executar os cenários US3 de `e2e/trip-budget.spec.ts` nos projetos chromium/mobile e conferir histórias/teclado; registrar erros corrigidos, evidências de preservação do rascunho e limitações em `specs/004-orcamento-estimado/quickstart.md`.

**Checkpoint**: Falhas e cancelamentos não podem perder preenchimento indevidamente, anunciar sucesso ou alterar dados fora do orçamento; os fluxos devem ser operáveis por teclado.

## Fase 6 — Revisão, documentação e validação integrada

**Objetivo**: verificar o conjunto das histórias, documentar a mudança entregue e distinguir evidência local de homologação real.

- [X] T034 [P] Atualizar `docs/mvp.md` com as regras efetivamente implementadas de orçamento e a referência correta à edição de passeios; documentar em `README.md` a nova migração antes do código e a reversão de aplicação preservando a coluna, sem alterar specs históricas.
- [X] T035 [P] Executar os comandos de regressão de `specs/004-orcamento-estimado/quickstart.md`: lint, typecheck, Jest, banco, Playwright, build e build-storybook; registrar comando, ambiente, resultado e limitações no mesmo arquivo. Executar concorrência de passeios quando afetada, somente no banco local exclusivo indicado pelo guia.
- [X] T036 Executar a homologação de `specs/004-orcamento-estimado/quickstart.md` em ambiente Supabase de validação autorizado, aplicando somente a migração nova antes do código e usando duas contas/dados descartáveis; verificar persistência após recarga, GraphQL, Data API com RLS, projeção textual de `9007199254740993.01`, zero/null, polling e preservação do roteiro; registrar evidências sem tokens e manter a tarefa pendente se faltar ambiente ou autorização.
- [X] T037 Conferir a cobertura de FR-001 a FR-020 e SC-001 a SC-009 usando a matriz de `specs/004-orcamento-estimado/tasks.md` e os resultados de `specs/004-orcamento-estimado/quickstart.md`; registrar falhas e limitações reais, sem marcar requisitos como verificados apenas por mock, e corrigir divergências dentro do escopo antes de encerrar.
- [X] T038 Atualizar os estados reais em `specs/004-orcamento-estimado/spec.md`, `specs/004-orcamento-estimado/plan.md` e `docs/specs/README.md`, distinguindo implementação, testes locais, homologação, envio e publicação; encerrar somente com evidências correspondentes, sem criar commits, push ou deploy por inferência desta lista.

## Dependências e ordem de execução

### Grafo das fases e histórias

```text
T001–T002 Preparação
        ↓
T003–T007 Fundamentos
        ↓
T008–T019 US1 — Gestão e consulta (P1)
        ↓
T020–T026 US2 — Comparação (P1)
        ↓
T027–T033 US3 — Recuperação e acessibilidade (P2)
        ↓
T034–T038 Revisão, documentação e homologação
```

US1 é a primeira fatia funcional. US2 utiliza a leitura, o controlador e o resumo de US1; seus cálculos e estados podem ser testados com dados preparados. US3 depende do modal e da remoção de US1; a sequência após US2 evita edições concorrentes dos mesmos componentes e de `e2e/trip-budget.spec.ts`, sem exigir os cálculos como pré-condição de seus testes isolados.

A homologação T036 precisa do ambiente de validação autorizado e não pode ser substituída por mocks. Sua indisponibilidade não invalida as tarefas locais já concluídas, mas impede afirmar homologação e conclusão integral.

### Dependências por tarefa

A tabela contém dependências diretas; as transitivas também se aplicam. IDs seguem uma ordem sequencial válida, mas os grupos indicados podem executar em paralelo.

| Tarefa | Dependências diretas |
| --- | --- |
| T001 | Nenhuma |
| T002 | T001 |
| T003 | T002 |
| T004 | T002 |
| T005 | T004 |
| T006 | T003, T005 |
| T007 | T006 |
| T008 | T007 |
| T009 | T007 |
| T010 | T007 |
| T011 | T007 |
| T012 | T008, T009, T010, T011 |
| T013 | T012 |
| T014 | T013 |
| T015 | T014 |
| T016 | T014 |
| T017 | T014 |
| T018 | T015, T016, T017 |
| T019 | T018 |
| T020 | T019 |
| T021 | T019 |
| T022 | T020, T021 |
| T023 | T022 |
| T024 | T023 |
| T025 | T024 |
| T026 | T025 |
| T027 | T026 |
| T028 | T027 |
| T029 | T028 |
| T030 | T027 |
| T031 | T029, T030 |
| T032 | T029, T030 |
| T033 | T031, T032 |
| T034 | T033 |
| T035 | T033 |
| T036 | T034, T035 |
| T037 | T036 |
| T038 | T037 |

## Oportunidades e exemplos de execução paralela

### Fundamentos

Após T002, escrever T003 (validação Zod) e T004 (migração SQL) em paralelo. T005 aguarda T004; T006 aguarda T003 e T005. T007 fecha os fundamentos. Não editar a migração antiga para fazer os testes passarem.

### US1

Após T007, escrever T008, T009, T010 e T011 em paralelo: contrato GraphQL, serviço, banco e interface usam arquivos diferentes. Confirmar as falhas relevantes antes de T012.

Após T014, executar este grupo:

```text
T015 → e2e/support/fixtures.ts
T016 → src/features/trips/components/trip-cost-summary.tsx
T017 → src/features/trips/components/budget-dialog.tsx
```

As propriedades e callbacks seguem os contratos já definidos. T018 integra os três resultados; T019 conecta à página e verifica a história.

### US2

Após T019, escrever em paralelo:

```text
T020 → src/features/trips/lib/trip-costs.test.ts
T021 → e2e/trip-budget.spec.ts
```

A implementação T022–T024 é sequencial por dependência entre cálculo, apresentação e integração. T025 documenta os estados e T026 verifica a história.

### US3

Após T027, executar T028 (ciclo do modal) em paralelo com T030 (remoção e layout do resumo). T029 sucede T028 no mesmo arquivo de modal. Depois de T029 e T030, executar em paralelo:

```text
T031 → src/features/trips/components/budget-dialog.stories.tsx
T032 → src/features/trips/components/trip-cost-summary.stories.tsx
```

T033 aguarda as duas histórias visuais. Não executar T027 junto com T021, pois ambos alteram o mesmo teste E2E.

### Revisão final

T034 (MVP/README) e T035 (checks/evidências no quickstart) podem executar em paralelo após T033. T036–T038 permanecem sequenciais. Qualquer correção que surja nos checks deve ser coordenada com quem estiver editando o arquivo afetado.

## Matriz de cobertura

As tarefas indicadas incluem implementação e evidência; a existência de uma tarefa não comprova atendimento.

| Requisitos / critérios | Tarefas principais |
| --- | --- |
| FR-001, FR-005, FR-006; SC-001 | T004–T007, T010–T019, T036 |
| FR-002, FR-003; SC-002 | T008–T013, T016, T018–T019, T036 |
| FR-004 | T003, T005–T006, T008–T009, T017, T027–T028 |
| FR-007; SC-004 | T016, T020–T026 |
| FR-008, FR-009, FR-010; SC-003 | T007, T020–T026 |
| FR-011; SC-005 | T020–T024 |
| FR-012; SC-009 | T021, T024, T026 |
| FR-013, FR-014; SC-006 | T014, T019, T021, T024, T026–T028, T036 |
| FR-015 | T016–T019, T023–T025 |
| FR-016, FR-017, FR-018; SC-008 | T009, T017–T019, T027–T033, T036 |
| FR-019 | T010–T011, T018–T019, T027, T030, T032 |
| FR-020; SC-007 | T027–T033, T035–T036 |

T034–T038 fecham documentação, regressão e rastreabilidade do conjunto. A revisão T037 deve conferir todos os vinte requisitos funcionais e nove critérios de sucesso.

## Estratégia de implementação

### Primeiro incremento

Concluir preparação, fundamentos e US1 (T001–T019). Esse incremento permite demonstrar definição, edição, remoção, consulta e permissões de forma independente. É o MVP incremental sugerido, não a entrega completa da spec 004.

### Entrega incremental

1. Verificar US1 com orçamento salvo, recarga e tentativas de alteração por participante.
2. Acrescentar US2 e validar a matriz de valores e os efeitos de alterações do roteiro.
3. Concluir US3 e validar falhas, descarte, foco, envio e responsividade.
4. Executar regressão e homologação, atualizar a documentação e registrar o estado real da entrega.

Não publicar a fatia de US1 como se cobrisse comparação ou acessibilidade completa. A conclusão da funcionalidade exige US1, US2, US3 e as verificações finais. Deploy e envio ao GitHub não são ações autorizadas automaticamente pela geração desta lista.

## Resumo e revisão da lista

- Total: 40 tarefas; preparação/fundamentos: 7; US1: 12; US2: 7; US3: 7; revisão final: 5; convergência: 2.
- Paralelismo: 17 tarefas com `[P]`, distribuídas em grupos com dependências e arquivos distintos.
- As marcações acompanham a execução; tarefas de homologação exigem evidência do ambiente real.
- Manter spec, plano e contratos como referências únicas de comportamento; não ampliar o escopo durante a execução.


## Phase 7: Convergence

Revisão de 2026-11-10: 20 requisitos funcionais, 9 critérios de sucesso, 26 cenários de aceite, 8 decisões técnicas, 5 princípios constitucionais e as 38 tarefas anteriores conferidos contra o código atual. Identificados dois achados `partial`, ambos de severidade HIGH. Naquela revisão, a funcionalidade ainda não estava integralmente concluída. O encerramento posterior está registrado ao final desta fase.

Evidências desta revisão: `npm test -- --runInBand --no-cache` aprovado com 104 testes em 11 suites; `npm run test:db` aprovado com 21 testes locais PGlite. A execução em memória de `TripDetails`, com hooks simulados, confirmou que um erro de consulta substitui o roteiro por `ErrorState` mesmo havendo dados anteriores. Os testes E2E existentes cobrem falha de salvamento e polling bem-sucedido, mas não a combinação com falha transitória do polling. Playwright, builds e inspeções visuais não foram reexecutados nesta revisão; seus resultados anteriores permanecem registrados no quickstart. Nenhuma dessas evidências comprova integração Supabase real.

- [X] T039 [US3] Corrigir a perda do rascunho de orçamento em `src/features/trips/components/trip-details.tsx` quando uma falha transitória da consulta periódica ocorre após falha de salvamento: preservar a árvore do modal em `src/features/trips/components/trip-budget.tsx` e `src/features/trips/components/budget-dialog.tsx`, o preenchimento e o último resumo confirmado, com feedback acessível e nova tentativa, mantendo os dados remotos no Apollo e o tratamento de acesso negado. Acrescentar em `e2e/trip-budget.spec.ts` regressão desktop/mobile para salvar com falha, falhar o polling e recuperar a consulta antes de repetir o salvamento sem redigitar; registrar resultados em `specs/004-orcamento-estimado/quickstart.md`. Origem: F1, HIGH; FR-018, SC-008, US3/AC5, T028 e plan: preservação do rascunho durante consultas periódicas (partial).
- [X] T040 Concluir a lacuna de validação integrada mediante a execução da T036, sem criar uma segunda homologação: usar ambiente Supabase de validação autorizado e duas contas, conferir persistência após recarga, GraphQL autenticado, Data API/RLS, transporte textual exato de `9007199254740993.01`, zero/null, polling entre sessões e preservação do roteiro; registrar resultados, ambiente e limitações sem tokens em `specs/004-orcamento-estimado/quickstart.md` e então reconferir a cobertura e os estados documentais de T037–T038. Manter T036 e esta tarefa pendentes enquanto não houver evidências reais; Jest, PGlite e Playwright com mocks não satisfazem essa condição. Origem: F2, HIGH; T036, FR-003, FR-005, FR-010, FR-013, SC-001, SC-002, SC-006 e plan: homologação de persistência e transporte real (partial).

T039 concluída em 2026-11-10: recuperação do rascunho e tratamento de acesso negado validados em desktop/mobile; resultados em [quickstart.md](quickstart.md). T036/T040 concluídas em 2026-11-11 com base na confirmação global de homologação manual relatada por Gabriel, com os limites documentados no quickstart. Revisão e versionamento realizados em 2026-11-11; push para origin autorizado por Gabriel, com registro no quickstart. Nenhum deploy manual executado nesta etapa.
