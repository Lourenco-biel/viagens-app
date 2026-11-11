# Plano de implementação: Orçamento estimado da viagem

**Branch Git**: `codex/setup-spec-kit` | **Data**: 2026-11-06 | **Spec**: [spec.md](spec.md)\
**Diretório**: `specs/004-orcamento-estimado`\
**Status**: implementação e validação local concluídas; correção do rascunho T039 validada em 2026-11-10; homologação manual com Supabase real relatada como concluída por Gabriel em 2026-11-11 (T036/T040; origem e limites no quickstart). Implementação versionada nesta branch; envio ao origin autorizado em 2026-11-11. Nenhum deploy manual executado nesta etapa. Evidências em [quickstart.md](quickstart.md).

**Entrada**: especificação 004. O pedido `$speckit-implement` de Gabriel em 2026-11-06 autorizou a implementação do escopo; registro em [spec.md](spec.md).

## Resumo

Acrescentar um orçamento opcional por pessoa à viagem, gerenciado pelo organizador e comparado ao custo dos passeios confirmados. Persistir uma coluna anulável, expor a gestão pelo GraphQL existente e integrar modal e comparação ao resumo do roteiro.

A precisão é preservada com decimal textual no transporte e centavos inteiros nos cálculos. Ausência permanece distinta de zero. Apollo continua responsável pelos dados remotos e pela atualização após mutações e consultas periódicas.

As decisões e alternativas estão em [research.md](research.md); os contratos detalham validação e comportamento verificável.

## Contexto técnico

| Aspecto | Definição |
| --- | --- |
| Linguagem/runtime | TypeScript 5.9.3, React 19.2.8, Node.js 24; ambiente consultado: 24.14.0 |
| Aplicação | Next.js 16.4.3, App Router, aplicação web com GraphQL Yoga 6.0.1 e GraphQL 17.0.2 |
| Interface | Tailwind CSS 4, Base UI 1.8.0, componentes shadcn existentes e Lucide |
| Dados e validação | Apollo Client 4.3.5, Supabase JS 2.118.0, Zod 4.6.7 |
| Persistência | Supabase PostgreSQL com RLS; configuração local PostgreSQL 17, CI de concorrência PostgreSQL 16 |
| Testes | Jest 30.5.2, PGlite 0.5.12, Playwright 1.63.0 e Storybook 10.6.4 |
| Plataforma | Navegadores desktop e celular; execução e scripts no WSL; publicação existente na Vercel |
| Desempenho | Uma passagem O(n) pelos passeios já carregados; nenhum pedido por passeio ou novo temporizador; manter consulta de 30 segundos |
| Restrições | Nenhuma dependência, store ou serviço pago adicional; não usar chave privilegiada; não mudar votos, confirmação ou edição de passeios |
| Escala/escopo | Uma página existente, uma coluna opcional, uma mutação e três componentes focados; sem nova rota de produto |

Versões obtidas dos pacotes instalados. Não se propõe atualização de dependências. O guia instalado `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` foi consultado; deve ser relido conforme necessário antes de alterar código Next.js.

## Verificação da constituição

| Princípio | Antes da pesquisa | Após o desenho |
| --- | --- | --- |
| I. Escopo e escrita | Spec em português com aceite e exclusões; planejamento solicitado | Plano limitado à spec 004; autorização de implementação registrada em 2026-11-06 |
| II. Arquitetura simples | Camadas atuais identificadas | Validação, cálculos, apresentação e acesso a dados separados dentro de trips; sem bibliotecas ou abstrações gerais novas |
| III. Permissões e integridade | Autenticação GraphQL, RLS e grants existentes identificados | Zod no cliente/servidor, constraint no banco, autorização de organizador e testes de chamadas diretas; migração aditiva |
| IV. Interface e acessibilidade | Dialog e confirmação existentes disponíveis | Modal, foco, mensagens, recuperação de erro, responsividade e histórias de estados especificados |
| V. Validação e rastreabilidade | Suites e comandos existentes identificados | Matriz de testes, homologação real e ordem de entrega documentadas; evidências futuras separadas de revisão documental |

**Resultado dos gates**: planejamento conforme antes e depois do desenho, sem exceções constitucionais ou dúvidas técnicas abertas. A autorização posterior de implementação está registrada na spec.

## Estrutura do projeto

### Documentação desta funcionalidade

```text
specs/004-orcamento-estimado/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   ├── graphql.md
│   └── interface.md
└── quickstart.md
```

[tasks.md](tasks.md) contém a lista gerada posteriormente e acompanha o estado da execução.

### Código afetado na implementação

Os caminhos abaixo foram implementados conforme o desenho; evidências e limites estão no quickstart.

```text
supabase/migrations/202611060001_trip_budget.sql       (novo)
src/lib/supabase/database.types.ts
src/lib/graphql/schema.ts
src/lib/graphql/schema.test.ts
src/features/trips/
├── model/trip-budget.ts                              (novo, validação e entrada)
├── model/trip-budget.test.ts                         (novo)
├── model/trip-detail.ts
├── lib/trip-costs.ts                                 (novo, cálculo e formatação)
├── lib/trip-costs.test.ts                            (novo)
├── server/trip-service.ts
├── server/trip-budget.test.ts                        (novo)
├── graphql/documents.ts
└── components/
    ├── itinerary.tsx
    ├── trip-budget.tsx                              (novo, mutação e estado local)
    ├── trip-cost-summary.tsx                        (novo, apresentação)
    ├── trip-cost-summary.stories.tsx                (novo)
    ├── budget-dialog.tsx                            (novo, formulário e modal)
    └── budget-dialog.stories.tsx                    (novo)
tests/trip-budget.test.mjs                           (novo)
e2e/trip-budget.spec.ts                              (novo)
e2e/support/fixtures.ts
docs/mvp.md
docs/specs/README.md
README.md
```

**Decisão de estrutura**: preservar a organização por funcionalidade. `Itinerary` substitui apenas seu bloco de custo por `TripBudget`; o controlador usa o resumo de apresentação e o modal, sem novo provider. `TripDetails` mantém sua consulta. Reutilizar `src/components/ui/dialog.tsx`, `input.tsx`, `button.tsx` e `src/components/confirm-button.tsx`. Atualizar fixtures tipadas afetadas pelo campo obrigatório anulável de `TripDetail`.

## Fase 0 — Pesquisa concluída

[research.md](research.md) registra oito decisões: integração, representação monetária, cálculo/formatação, autorização/migração, contrato/cache, modal, testes e contexto do Spec Kit. A pesquisa de banco foi delegada em paralelo e integrada ao desenho; nenhuma implementação foi realizada.

O script de setup retornou o identificador `BRANCH=004-orcamento-estimado` por fallback do diretório. A branch Git real permanece `codex/setup-spec-kit`.

## Fase 1 — Modelo e contratos concluídos

- [data-model.md](data-model.md): coluna, restrições, tipos de transporte, estados derivados e preservação dos dados.
- [contracts/graphql.md](contracts/graphql.md): mutação, consulta, validação, autorização, erros e cache.
- [contracts/interface.md](contracts/interface.md): estados do resumo e do modal, remoção, teclado e Storybook.
- [quickstart.md](quickstart.md): comandos e cenários de validação local e integração real.

## Sequência de implementação proposta

1. **Persistência e integridade**: criar migração aditiva, atualizar tipos e provar instalação nova e migração sobre dados existentes. Manter grants/RLS e validar escrita direta por cada papel.
2. **Contrato e serviço**: criar schema Zod e mutação; validar antes de persistir, exigir organizador e linha alterada, ler orçamento como texto e retornar detalhes. Acrescentar campo ao fragmento e tratar mensagens específicas de orçamento.
3. **Cálculo e interface**: implementar centavos exatos, os quatro estados do resumo e o modal. Conectar a mutação ao Apollo sem resposta otimista; manter rascunho independente das atualizações periódicas; confirmar remoção.
4. **Verificação dos fluxos**: atualizar fixtures, adicionar Jest/PGlite/Playwright e histórias; verificar atualização por confirmação, edição/reabertura e remoção de passeios, sem regressão de votos.
5. **Documentação e entrega**: atualizar regras vigentes no MVP, instruções da migração no README e status no índice; registrar checks e homologação. Aplicar migração antes do código em ambiente de entrega autorizado.

As etapas 2 e 3 dependem do contrato e dos tipos definidos na etapa 1; as histórias podem ser desenvolvidas com dados locais durante a conexão do serviço. A entrega exige o conjunto completo de critérios, não somente o caminho de sucesso.

## Cobertura e evidências exigidas

| Requisitos | Evidência planejada |
| --- | --- |
| FR-001–FR-003 | Jest do serviço/GraphQL e banco com organizador, participante, externo, membro removido e anônimo |
| FR-004–FR-006 | Zod + constraint; zero, ausência, inválidos, valor grande exato, migração com registros anteriores e recarga |
| FR-007–FR-011 | Jest dos quatro estados e centavos; Playwright e histórias de ausência, restante, limite e excesso |
| FR-012–FR-014 | Fluxos de sugerir/votar/confirmar acima do limite; reabertura, edição, remoção e atualização periódica |
| FR-015–FR-020 | Desktop/celular/teclado, foco, cancelamento, envio, falha/repetição, confirmação e preservação de dados |
| SC-001–SC-009 | Matriz completa do quickstart, incluindo homologação de persistência e transporte real |

Executar checks proporcionais segundo o [quickstart](quickstart.md). Não considerar mocks GraphQL como prova de RLS ou persistência real.

## Entrega, compatibilidade e riscos controlados

- A nova coluna não possui default zero nem backfill. Aplicar a nova migração após as existentes; o código anterior continua funcionando com a coluna adicional.
- O código novo depende da migração. Em reversão de aplicação, manter a coluna e os dados; removê-la apagaria orçamentos e exige decisão separada.
- `saveTrip` deve continuar alterando somente nome, destino e datas; `setTripBudget` altera somente orçamento. Não tocar passeios, votos ou membros.
- O trigger existente de período continua ativo. Não remover restrições para permitir uma atualização de orçamento.
- Falha depois da gravação e antes da resposta não garante rollback; manter rascunho e repetir a atribuição idempotente, reconciliando pela leitura.
- Confirmar transporte textual real e nulabilidade do cast na integração Supabase; o teste em memória não valida PostgREST.
- Registrar separadamente implementação, testes locais, homologação, commits, envio e publicação. Os resultados da execução estão no quickstart.

## Validação deste planejamento

Em 2026-11-06, no WSL com Node.js 24.14.0, foram verificados os seis artefatos do plano, links locais, tabelas, blocos de código, ausência de marcadores pendentes e ponteiro da funcionalidade. A extensão SDL proposta e o exemplo de mutação foram analisados e validados contra o schema atual pela biblioteca GraphQL instalada. As verificações passaram.

Não há arquivo de extensões com hooks de planejamento. Testes de comportamento da funcionalidade, migração e homologação Supabase permanecem previstos no quickstart; não foram executados nesta etapa documental.
