# Modelo de dados — Orçamento estimado da viagem

**Data**: 2026-11-06\
**Referências**: [spec](spec.md), [pesquisa](research.md) e [contrato GraphQL](contracts/graphql.md).

## Viagem

Adicionar à entidade existente `public.trips`:

| Campo | Persistência | Significado |
| --- | --- | --- |
| `budget_per_person` | `numeric`, anulável, sem precisão/escala declaradas | Estimativa em reais por pessoa, referente somente a passeios |
| `NULL` | Ausência | Orçamento não definido |
| `0` | Valor definido | Planejamento somente de passeios gratuitos |

Não adicionar coluna de total, saldo, excesso, orçamento por membro ou moeda. BRL é fixo no escopo. A relação continua sendo uma viagem com seu organizador, membros e passeios existentes.

### Restrições

A coluna aceita `NULL` ou, simultaneamente:

- Valor finito: excluir `NaN`, `Infinity` e `-Infinity` explicitamente.
- Valor maior ou igual a zero.
- `scale(budget_per_person) <= 2`.

Não declarar `numeric(p, 2)`: essa coerção poderia arredondar antes da validação. Não aplicar o teto individual dos passeios ao orçamento. Valores como `1.001` e `1.230` são inválidos pela precisão recebida. Texto vazio ou não numérico não é convertido em ausência ou zero.

O banco pode armazenar uma ou nenhuma casa decimal; a representação de saída da aplicação é normalizada para duas casas.

### Autorização

| Papel | Consultar | Definir, editar ou remover |
| --- | --- | --- |
| Organizador | Sim | Sim |
| Participante atual | Sim | Não |
| Pessoa externa ou membro removido | Não | Não |
| Anônimo | Não | Não |

Preservar as políticas `trips_read`, `trips_create` e `trips_edit`, os grants por tabela e a revogação de acesso anônimo. Não há novo grant ou função privilegiada. A aplicação verifica a identidade e o organizador, mas a segurança não depende dessas verificações.

O `UPDATE` identifica uma viagem e altera apenas a nova coluna; deve retornar a linha alterada. Zero linhas não significa sucesso.

## Tipos de transporte

| Camada | Representação |
| --- | --- |
| Linha bruta Supabase `TripRow` | `budget_per_person: number \| null`; não usar essa leitura bruta para cálculo exato |
| Inserção/atualização Supabase | `budget_per_person?: string \| null`, decimal com ponto |
| Projeção de `requireTrip` | `budget_per_person: string \| null`, por `budget_per_person::text` |
| `TripDetail` e GraphQL | `budgetPerPerson: string \| null`, campo presente nos detalhes |
| Rascunho do formulário | String local; vazio indica preenchimento incompleto |
| Cálculo do resumo | Centavos `bigint`, restritos a funções locais |

Em `database.types.ts`, o tipo `Insert` de `trips` deve omitir o novo campo do tipo bruto e reintroduzi-lo como string opcional anulável. `Update` já deriva de `Partial<Insert>`. A projeção textual tem tipo próprio que preserva `null`; não depender somente da inferência do cast.

Consumidores como `tripSummary` devem declarar os campos de que precisam, sem exigir o campo bruto numérico. A leitura de listagem não usa o orçamento; a consulta de detalhes usa a projeção exata. A resolução do campo GraphQL fora dos detalhes está definida no contrato.

## Passeio e comparação derivada

Não alterar o modelo de passeio. A entrada existente admite custo de zero a R$ 1.000.000,00 com até duas casas. O status `confirmed` inclui o custo; `proposed` o exclui.

Para cada passeio confirmado, adaptar seu custo validado a centavos inteiros antes de somar. Converter a string do orçamento a centavos sem `Number`. A comparação recebe o orçamento opcional e os passeios; a quantidade de membros não é uma entrada do cálculo.

| Estado derivado | Condição | Apresentação |
| --- | --- | --- |
| `undefined` | Orçamento `null` | Total e “Orçamento ainda não definido”, sem saldo/excesso |
| `remaining` | Total menor que orçamento | Orçamento, total e diferença positiva restante |
| `reached` | Total igual ao orçamento | Orçamento, total e “Limite atingido” |
| `exceeded` | Total maior que orçamento | Orçamento, total e aviso com diferença positiva excedida |

Os nomes de estado são discriminantes internos; `undefined` nesta tabela não substitui o `null` persistido. Nenhum resultado derivado é persistido ou serializado como `bigint`.

## Transições e consistência

- Sem orçamento → definir string válida → orçamento definido, inclusive zero.
- Definido → editar → substituir somente o orçamento.
- Definido → remover após confirmação → `NULL`.
- Qualquer estado → cancelar ou entrada inválida → nenhuma gravação.
- Repetir uma atribuição ou remoção → mesmo estado persistido, sem efeitos em outras entidades.
- Envios concorrentes do organizador → última gravação concluída prevalece; não introduzir versionamento.
- Confirmar, reabrir ou excluir passeio → recalcular com o novo conjunto de confirmados.
- Editar efetivamente passeio confirmado → a regra existente o reabre; retirar seu custo até nova confirmação.
- Receber atualização remota → atualizar o resumo, preservando o rascunho de um modal aberto.

Se a gravação ocorrer e sua resposta falhar, a operação pode estar persistida. O cliente conserva o rascunho e a última informação confirmada até receber nova leitura; uma repetição é segura por ser atribuição idempotente.

## Migração e preservação

Criar `supabase/migrations/202611060001_trip_budget.sql`, verificando a disponibilidade da numeração na implementação. Aplicar depois das migrações de MVP e edição de passeios, sem editar arquivos históricos.

A migração adiciona somente coluna anulável e constraint; viagens anteriores passam a ter `NULL`. Inserções que omitam o campo também ficam sem orçamento. Não realizar backfill, recalcular passeios ou alterar proprietários, membros, convites, votos e versões.

Verificar instalação do zero e atualização de banco já preenchido. Comparar os dados anteriores e posteriores, inclusive após definir/editar/remover orçamento. Manter o trigger de validação do período da viagem.

O código anterior é compatível com a coluna adicional. O código novo requer a migração. Reverter a aplicação não exige apagar a coluna; uma remoção posterior da coluna seria destrutiva e não integra este plano.
