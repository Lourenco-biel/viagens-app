# Especificações de alterações

Esta pasta reúne as propostas para mudanças no projeto. Cada alteração tem um arquivo com o problema, o comportamento esperado e os critérios para validar a entrega.

As regras atuais estão em [MVP](../mvp.md), e os resultados dos testes em [Validação do MVP](../validacao-mvp.md). Os arquivos `.spec.ts` em `e2e/` são testes automatizados, não especificações de produto.

## Como usar

1. Copie [TEMPLATE.md](TEMPLATE.md) para `NNN-nome-da-alteracao.md`, usando o próximo número disponível, a partir de `001`.
2. Preencha o problema, o escopo, as regras e os critérios de aceite antes de implementar. Para mudanças pequenas, mantenha a descrição curta; marque seções sem impacto como “Não se aplica”.
3. Registre dúvidas e decisões pendentes. Uma ideia documentada não significa que já foi aprovada para desenvolvimento.
4. Atualize o índice abaixo e o status conforme o trabalho avançar.
5. Na entrega, registre testes e commits. Atualize também `docs/mvp.md` se as regras vigentes mudarem.

## Status

- **Rascunho:** proposta em discussão, com decisões em aberto.
- **Pronta:** escopo e critérios definidos e prioridade acordada com Gabriel.
- **Em implementação:** desenvolvimento iniciado.
- **Em validação:** implementação disponível, com critérios ainda em verificação.
- **Concluída:** critérios atendidos, com evidências registradas.
- **Adiada:** sem previsão de implementação; registre o motivo.

## Índice

As propostas abaixo aguardam validação antes de ampliar o comportamento do MVP.

| Spec | Objetivo | Status |
| --- | --- | --- |
| [001 — Edição de passeios](001-edicao-de-passeios.md) | Corrigir dados de um passeio sem excluí-lo, com regras explícitas para permissões, votos e confirmação | Rascunho |

IA, chat, fotos e integrações com reservas e locadoras continuam fora do MVP. Sua menção no histórico não representa compromisso de implementação.
