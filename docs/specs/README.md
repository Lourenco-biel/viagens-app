# Especificações de alterações

Uso esta pasta para organizar as próximas alterações do projeto antes de começar a desenvolver. Cada spec registra o problema que quero resolver, as regras e o que preciso testar para considerar a entrega pronta.

As regras atuais estão em [MVP](../mvp.md), e os resultados dos testes em [Validação do MVP](../validacao-mvp.md). Os arquivos `.spec.ts` em `e2e/` são testes automatizados, não especificações de produto.

## Como usar

1. Copie [TEMPLATE.md](TEMPLATE.md) para `NNN-nome-da-alteracao.md`, usando o próximo número disponível, a partir de `001`.
2. Preencha o problema, o escopo, as regras e os critérios de aceite antes de implementar. Para mudanças pequenas, mantenha a descrição curta; marque seções sem impacto como “Não se aplica”.
3. Registre dúvidas e decisões pendentes. Uma ideia documentada não significa que já foi aprovada para desenvolvimento.
4. Atualize o índice abaixo e o status conforme o trabalho avançar.
5. Na entrega, registre testes e commits. Atualize também `docs/mvp.md` se as regras vigentes mudarem.

## Status

- **Rascunho:** proposta em discussão, com decisões em aberto.
- **Pronta:** escopo revisado, decisões fechadas e prioridade definida.
- **Em implementação:** desenvolvimento iniciado.
- **Em validação:** implementação disponível, com critérios ainda em verificação.
- **Concluída:** critérios atendidos, com evidências registradas.
- **Adiada:** sem previsão de implementação; registre o motivo.

## Índice

O status de cada spec indica se a proposta está em discussão, pronta para desenvolvimento ou já foi implementada.

| Spec | Objetivo | Status |
| --- | --- | --- |
| [001 — Edição de passeios](001-edicao-de-passeios.md) | Corrigir dados de um passeio sem excluí-lo, com regras explícitas para permissões, votos e confirmação | Pronta |

IA, chat, fotos e integrações com reservas e locadoras continuam fora do MVP. Vou definir o escopo de cada uma quando entrar no planejamento.

## Escrita

As specs são documentos do projeto. Uso primeira pessoa para explicar objetivos e escolhas, e regras diretas para descrever o comportamento da aplicação. Evito relatos da conversa, aprovações em terceira pessoa e formalidades que não ajudam a implementar ou validar a mudança.

Mantenho separados o que decidi fazer, o que já foi implementado e o que realmente testei. Sou responsável por revisar as decisões e validar a entrega.
