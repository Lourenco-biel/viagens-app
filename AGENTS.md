# Desenvolvimento com Spec Kit

- Consultar `.specify/memory/constitution.md` antes de especificar, planejar ou implementar.
- Manter specs em português, objetivas e impessoais. Gabriel valida o escopo antes da implementação.
- Usar as skills em `.agents/skills/speckit-*` e executar os scripts Bash no WSL, na raiz do projeto.
- Preservar as specs 001–003 em `docs/specs/`. Criar as próximas em `specs/`, começando por 004; considerar o histórico ao escolher a numeração e atualizar o índice em `docs/specs/README.md`.
- Não editar as skills ou templates gerados para personalizar o processo; usar a constituição e, se necessário, overrides locais suportados pelo Spec Kit.
- Configuração e comandos: `docs/spec-kit.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
