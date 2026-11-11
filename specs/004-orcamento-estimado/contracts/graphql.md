# Contrato GraphQL — Orçamento estimado

**Endpoint existente**: `POST /api/graphql`\
**Referências**: [modelo](../data-model.md) e [interface](interface.md).

## Extensão proposta do schema

```graphql
extend type Trip {
  budgetPerPerson: String
}

input TripBudgetInput {
  budgetPerPerson: String
}

extend type Mutation {
  setTripBudget(id: ID!, input: TripBudgetInput!): Trip!
}
```

Este trecho descreve o contrato adicional, não um novo endpoint ou um schema completo.

`budgetPerPerson` é string decimal em reais, com ponto e duas casas na saída; ausência é `null`. Exemplo: `"500.00"`, `"0.00"`. Nunca retornar `""`, zero para ausência ou um número JSON.

O campo deve existir no `TripDetailFields`, reutilizado por consultas e mutações de viagem/passeio. `tripDetail` retorna o valor explicitamente. Como `Trip` também aparece em listagens, seu resolver de campo deve buscar o detalhe autorizado quando o valor estiver `undefined`; `null` é resposta válida e não deve provocar nova busca. A listagem atual não precisa passar a solicitar orçamento.

## Entrada e semântica

O objeto `input` é obrigatório. Dentro dele, `budgetPerPerson` deve estar presente; sua omissão é recusada por Zod no servidor, apesar de o campo GraphQL ser anulável.

| Entrada | Resultado |
| --- | --- |
| `{"budgetPerPerson":"500"}` | Definir ou substituir por `"500.00"` |
| `{"budgetPerPerson":"600.5"}` | Definir ou substituir por `"600.50"` |
| `{"budgetPerPerson":"0.00"}` | Definir zero |
| `{"budgetPerPerson":null}` | Remover explicitamente |
| `{}`, string vazia, sinal negativo, texto, expoente, vírgula ou mais de duas casas | Rejeitar |
| Número JSON em vez de string | Rejeitar pela coerção GraphQL |

A string da API usa dígitos e um ponto decimal opcional, seguido por uma ou duas casas; zeros à esquerda podem ser normalizados. Não aceitar notação científica, separadores de milhar ou símbolos monetários. O formulário pode aceitar vírgula ou ponto, normalizando antes do envio conforme o contrato de interface. Não arredondar entradas inválidas.

Validar UUID, estrutura e valor com Zod; usar a mesma regra monetária no cliente e no servidor. No servidor, exigir presença da propriedade e preservar `null` como operação explícita. O limite existente de 65.536 bytes do corpo HTTP continua aplicável.

## Operação e resposta

```graphql
mutation SetTripBudget($id: ID!, $input: TripBudgetInput!) {
  setTripBudget(id: $id, input: $input) {
    id
    budgetPerPerson
    activities {
      id
      estimatedCost
      status
    }
  }
}
```

Variáveis ilustrativas:

```json
{
  "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "input": { "budgetPerPerson": "500.00" }
}
```

Na aplicação, selecionar o fragmento completo `TripDetailFields`, não apenas o subconjunto ilustrativo. A resposta inclui a identidade da viagem e o orçamento confirmado; Apollo normaliza a entidade existente.

Ordem de processamento:

1. Autenticar pela sessão existente.
2. Validar ID e entrada.
3. Consultar viagem acessível e exigir organizador.
4. Atualizar exclusivamente `budget_per_person` com string ou `null`, filtrando por ID e exigindo linha retornada.
5. Retornar os detalhes da viagem, lendo o orçamento com projeção textual.

A constraint e a RLS continuam válidas no acesso direto ao banco. Não usar chave privilegiada, RPC nova ou atualização do objeto completo da viagem.

## Erros

| Situação | Código GraphQL/HTTP esperado | Efeito |
| --- | --- | --- |
| Sem sessão | `UNAUTHENTICATED` | Nenhuma operação de dados |
| UUID, propriedade ou valor inválido | `BAD_USER_INPUT` | Não gravar; `fieldErrors.budgetPerPerson` quando aplicável |
| Participante comum de viagem acessível | `FORBIDDEN` | Valor persistido inalterado |
| Viagem inexistente ou invisível ao usuário | `NOT_FOUND` | Não revelar dados |
| Permissão negada pelo banco | `FORBIDDEN` | Não comunicar sucesso |
| Nenhuma linha afetada após a autorização inicial | `NOT_FOUND` | Não comunicar sucesso |
| Erro de constraint do orçamento | `BAD_USER_INPUT` | Mensagem específica de valor/precisão |
| Falha inesperada de persistência ou leitura da resposta | `OPERATION_FAILED` | Erro seguro, sem detalhes internos |
| Origem, formato HTTP ou tamanho inválido | Proteções HTTP atuais: 403, 415 ou 413 | Preservar tratamento existente |

A coerção de um tipo GraphQL inválido pode falhar antes do resolver e de Zod; não exigir `fieldErrors` nesse caso. Não reutilizar a mensagem atual de “período do passeio” para falhas do orçamento; tratar os erros na operação correspondente sem alterar o comportamento de operações antigas.

## Cache e atualização

- Incluir o campo em `TripDetail`, no fragmento compartilhado e nas fixtures completas.
- Manter valores de rede como string ou `null`, inclusive no cache; cálculos `bigint` ficam fora dele.
- Não aplicar resposta otimista. Atualizar pela resposta confirmada e manter o polling existente de 30 segundos.
- Definir, editar ou remover orçamento atualiza o mesmo objeto `Trip`; alterações de passeios recalculam o resumo com o mesmo conjunto de dados recebido.
- Se a resposta falhar após a gravação, não prometer rollback: permitir nova tentativa idempotente e reconciliação por leitura.

## Verificação do contrato

Validar os documentos contra o schema, testar autenticação e todas as entradas da tabela, comprovar autorização no serviço e no banco e conferir o ciclo de string decimal exata pelo PostgREST. Incluir `"9007199254740993.01"`, `null`, `"0.00"` e propriedade omitida. Os testes de interface simulados não substituem essa validação.
