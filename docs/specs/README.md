# Especificações de alterações

Esta pasta reúne as especificações das alterações do projeto. Cada spec define objetivo, escopo, regras e critérios de aceite antes da implementação.

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
| [001 — Edição de passeios](001-edicao-de-passeios.md) | Corrigir dados de um passeio sem excluí-lo, com regras explícitas para permissões, votos e confirmação | Em validação |
| [002 — Navegação e modais de passeios](002-navegacao-e-modais-de-passeios.md) | Separar o retorno do cabeçalho, tornar os cards clicáveis e usar modal para sugerir e editar passeios | Em validação |
| [003 — Modal de convite e menu de participantes](003-modal-de-convite-e-menu-de-participantes.md) | Aceitar convites em modal e acessar a remoção pelo menu ao lado do participante | Rascunho |

IA, chat, fotos e integrações com reservas e locadoras continuam fora do MVP e exigem specs próprias antes da implementação.

## Escrita

- Descrever diretamente o comportamento esperado: “O aceite deve aparecer em modal”, “Somente o organizador pode remover participantes”.
- Evitar primeira pessoa, intenções pessoais e relatos da conversa.
- Manter o objetivo curto. Detalhar regras, fluxos e exceções nas seções correspondentes.
- Incluir contexto e justificativas apenas quando ajudarem a entender uma decisão. Evitar repetir requisitos em uma seção de decisões.
- Usar critérios de aceite observáveis e verificáveis.
- Separar requisitos, implementação e evidências de testes. Não apresentar uma proposta como entregue ou validada.
