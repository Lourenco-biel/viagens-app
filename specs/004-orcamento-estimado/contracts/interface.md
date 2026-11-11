# Contrato de interface — Orçamento estimado

**Local**: resumo de custos na página de detalhes da viagem.\
**Componentes propostos**: `TripBudget` (controle), `TripCostSummary` (apresentação) e `BudgetDialog` (modal/formulário).

## Resumo

O resumo permanece visível mesmo sem passeios. Todos os estados identificam “Estimativas por pessoa · somente passeios”, em reais.

| Estado | Informação | Ações do organizador |
| --- | --- | --- |
| Sem orçamento | Total confirmado e “Orçamento ainda não definido” | “Definir orçamento” |
| Restante | Orçamento, total e valor restante | “Editar orçamento”, “Remover orçamento” |
| Limite atingido | Orçamento, total e “Limite atingido” | As mesmas |
| Excedido | Orçamento, total e aviso textual com o valor excedido | As mesmas |

Participantes comuns não recebem ações de alteração. Não mostrar saldo ou excesso no estado sem orçamento. Zero é definido e deve oferecer edição/remoção. Aviso de excesso não desabilita controles do roteiro. Formatar todas as quantias com duas casas; valores longos devem quebrar linha sem ocultar ações.

A apresentação recebe um resultado derivado dos valores atuais. O número de participantes não participa do cálculo. Não manter um estado local duplicado do orçamento confirmado.

## Definir e editar

- Abrir `Dialog` pelos acionadores do resumo, com título “Definir orçamento” ou “Editar orçamento”.
- Exibir descrição de estimativa por pessoa referente apenas a passeios e campo “Orçamento estimado por pessoa (R$)”.
- Na definição, começar vazio. Na edição, capturar o valor salvo ao abrir; zero deve aparecer como zero.
- Utilizar entrada textual com teclado decimal (`inputMode="decimal"`) para não converter prematuramente grandes valores em `number`.
- Aceitar dígitos com vírgula ou ponto decimal e até duas casas, sem separador de milhar. Remover espaços externos, normalizar vírgula para ponto e usar o schema compartilhado. Exemplo de orientação: “Use até duas casas decimais, sem separador de milhar”.
- Valores vazios, negativos, não numéricos ou com casas excedentes geram mensagem vinculada ao campo. Não corrigir por arredondamento.
- Oferecer “Salvar orçamento” e “Cancelar”, além de fechamento com nome acessível.
- Antes do envio, cancelar, Escape, fechamento ou clique externo não gravam. Seguir o padrão atual de confirmação de descarte quando houver rascunho alterado; cancelar esse descarte preserva o formulário.
- Durante o envio, indicar “Salvando...”, impedir duplicação e fechar/descartar até sua conclusão, seguindo o padrão do modal de passeio.
- Em sucesso confirmado, fechar, atualizar o resumo e anunciar “Orçamento salvo”.
- Em falha, manter modal e preenchimento, mostrar erro e liberar correção/nova tentativa.
- Atualizações periódicas podem alterar o resumo, mas não remontar o modal ou sobrescrever seu rascunho.

## Remover

Usar a ação explícita “Remover orçamento” com confirmação: “Remover o orçamento desta viagem? Os passeios e seus custos serão mantidos.”

Reutilizar a confirmação existente, com “Confirmar” e “Cancelar”. Cancelar não envia operação. Confirmar envia `budgetPerPerson: null`; durante o envio, bloquear repetição e indicar processamento.

Em sucesso, retornar ao estado sem orçamento e anunciar “Orçamento removido”. Em falha, manter a última informação confirmada, exibir erro acessível e permitir nova tentativa. A área de confirmação e o controlador devem tratar rejeições sem promessa não capturada.

## Foco e acessibilidade

- Foco inicial no campo, contenção no modal, navegação por Tab/Shift+Tab e foco visível.
- `label` associado, `aria-invalid` e `aria-describedby` para erro de campo; mensagens acessíveis para erro e sucesso.
- Ao fechar o modal, devolver foco ao acionador existente. Se a ação mudou de “Definir” para “Editar”, usar o acionador equivalente.
- Ao concluir ou cancelar a remoção, restaurar foco na ação de orçamento apropriada. Não depender da substituição automática de botões pelo `ConfirmButton`.
- Manter título e descrição do modal acessíveis e ícone de fechamento com nome.
- Não depender apenas de cores para diferenciar restante, limite e excesso.
- Modal com altura limitada ao viewport e rolagem interna; resumo e controles devem funcionar nas larguras desktop e celular e em viewport baixo.

## Estados de Storybook e verificações

Criar histórias do resumo: sem orçamento para organizador e participante, restante, limite atingido, excedido, zero e quantia longa. Criar histórias do modal: definição, edição, zero, validação, envio pendente e erro com repetição; incluir demonstração da remoção e sua falha no fluxo do resumo.

Usar componentes de apresentação com propriedades e callbacks para histórias, sem chamadas de rede reais. Verificar fluxos no Playwright desktop/celular, incluindo teclado, falha, atualização periódica durante digitação e remoção sem apagar passeios.
