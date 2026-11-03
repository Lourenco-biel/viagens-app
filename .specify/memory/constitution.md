# Constituição — Viagens App

## Princípios

### I. Escopo definido e documentação objetiva

Cada funcionalidade deve ter requisitos, regras e critérios de aceite antes da implementação.
As specs devem ser escritas em português, com frases impessoais e verificáveis, sem repetir
problema e objetivo. Gabriel valida o escopo; uma proposta não autoriza sua implementação.
O trabalho já autorizado deve continuar sem solicitar novamente a mesma aprovação.
IA, chat, fotos, reservas e locadoras exigem specs próprias antes de entrar no produto.

### II. Arquitetura simples e responsabilidades claras

O código deve seguir a organização existente por funcionalidades, separar apresentação,
validação e acesso a dados e reutilizar componentes quando houver responsabilidade própria.
Os princípios SOLID devem orientar essas decisões, sem criar camadas ou abstrações sem uso.
Dados remotos ficam no Apollo; estado de interface fica em hooks locais. Novas bibliotecas
ou stores precisam de uma necessidade concreta registrada no plano.
Comentários devem explicar somente decisões que não ficam claras no código.

### III. Permissões e integridade dos dados

Autenticação e autorização devem ser verificadas no servidor e no banco, não apenas na tela.
Preservar as regras de organizador, participante, convites e votos ao alterar qualquer fluxo.
Validar entradas com Zod no cliente e no servidor. Operações relacionadas devem preservar
consistência, inclusive em repetição ou concorrência quando aplicável.
Segredos ficam fora do Git e do cliente. Mudanças de dados exigem migração versionada e
registro dos efeitos sobre os dados existentes.

### IV. Interface consistente e acessível

Reutilizar shadcn compatível com Base UI, os estilos existentes e os componentes do projeto.
Os fluxos devem funcionar em desktop e celular, com nomes acessíveis, teclado, foco coerente,
estados de envio e mensagens de erro. Ações destrutivas devem pedir confirmação.
Documentar no Storybook os componentes e estados relevantes da alteração.
Quando houver telas no Figma, manter o desenho alinhado ao comportamento especificado.

### V. Validação proporcional e entrega rastreável

Usar Jest para regras e lógica, Playwright para fluxos e testes de banco para permissões,
migrações e integridade. Os testes devem verificar comportamentos, não copiar a implementação.
Executar os checks afetados pela mudança e registrar resultados, ambiente e limitações.
Testes simulados não comprovam envio de e-mail ou integração real com Supabase.
Criar commits por alteração coerente, seguindo Conventional Commits.
Declarar separadamente o que foi implementado, testado, enviado ao GitHub e publicado.

## Stack e restrições

- Next.js App Router, React, TypeScript e Tailwind CSS.
- shadcn/Base UI e Lucide para interface; Storybook para documentação dos componentes.
- GraphQL Yoga no backend e Apollo Client no frontend.
- Supabase Auth e PostgreSQL com RLS; Zod para validação.
- Jest, Playwright e os testes SQL existentes para validação.
- Vercel para publicação e Brevo no SMTP do Supabase.
- Priorizar os planos gratuitos solicitados por Gabriel; não contratar serviços pagos.
- Antes de alterar código Next.js, consultar a documentação instalada indicada no AGENTS.md.

## Fluxo de desenvolvimento

1. Descrever a mudança na spec e resolver as dúvidas que alterem o comportamento.
2. Registrar a validação de Gabriel antes de implementar uma funcionalidade nova.
3. Elaborar o plano técnico com a stack atual e dividir tarefas por entrega verificável.
4. Implementar o escopo autorizado, mantendo as regras e contratos fora dele.
5. Verificar os critérios de aceite, executar os checks pertinentes e registrar os resultados.
6. Fazer commits convencionais e distinguir a validação local da conferência após publicação.

As specs 001–003 em `docs/specs/` permanecem como histórico. As próximas funcionalidades usam
os artefatos do Spec Kit, com numeração a partir de 004 e links no índice de `docs/specs/README.md`.
Não criar duas versões ativas da mesma spec. Ajustes nas regras vigentes também devem atualizar
`docs/mvp.md`; o código e as specs implementadas devem ser consultados para identificar divergências.

## Governança

Esta versão registra os acordos existentes do projeto. Instruções explícitas de Gabriel
prevalecem; mudanças nos acordos devem atualizar este arquivo e os artefatos afetados.
Usar versão major para mudanças incompatíveis nas regras, minor para novos princípios e patch
para esclarecimentos. Registrar a data de cada alteração.
Planos e revisões devem conferir estes princípios e documentar exceções justificadas.

**Versão**: 1.0.0 | **Adotada em**: 2026-11-03 | **Atualizada em**: 2026-11-03
