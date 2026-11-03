# Spec Kit no Viagens App

## Instalação

Configurado em 2026-11-03 no Ubuntu/WSL, no projeto `/home/gabriel/projects/viagens-app`.

- Python 3.12.3 já disponível.
- uv 0.13.7 instalado em `~/.local/bin`.
- Specify CLI 1.2.6 instalado pelo uv, a partir da tag oficial `v1.2.6` do repositório `github/spec-kit`.
- Integração `codex`, com skills locais e scripts Bash.
- Constituição 1.0.0 em `.specify/memory/constitution.md`.

O PATH do zsh foi atualizado. Em um terminal já aberto, iniciar outra sessão ou executar
`export PATH="$HOME/.local/bin:$PATH"` antes de usar `specify`.

Para conferir no WSL:

```bash
cd ~/projects/viagens-app
specify version
specify integration status
```

A inicialização usou `--ignore-agent-tools` porque o agente desta sessão roda no aplicativo
Codex do Windows. Isso dispensa apenas a checagem do executável na instalação; os scripts
do projeto continuam rodando no WSL. Não foi instalado outro Codex CLI no Linux.

## Uso

Abrir o repositório `viagens-app` como projeto no Codex para disponibilizar as skills locais.
Se a sessão atual não reconhecer as novas skills, abrir uma nova sessão nesse repositório.
No Windows, a pasta é `\\wsl.localhost\Ubuntu\home\gabriel\projects\viagens-app`.

As invocações abaixo são mensagens no chat do agente, não comandos do terminal:

| Skill | Resultado |
| --- | --- |
| `$speckit-specify` | Requisitos, regras e critérios de aceite da mudança |
| `$speckit-clarify` | Esclarecimento de requisitos ambíguos |
| `$speckit-plan` | Plano técnico usando a arquitetura existente |
| `$speckit-tasks` | Tarefas de implementação |
| `$speckit-analyze` | Verificação de consistência entre spec, plano e tarefas |
| `$speckit-implement` | Execução do escopo autorizado |
| `$speckit-converge` | Verificação da implementação contra os artefatos |

Usar `$speckit-constitution` quando os acordos do projeto mudarem. A constituição inicial
já registra a stack, a escrita das specs, as regras de qualidade e os commits convencionais.

## Histórico e próximas specs

As specs 001–003 permanecem em `docs/specs/`. O template antigo serve como referência histórica.
As novas specs usam `specs/004-nome-da-alteracao/`, com `spec.md`, `plan.md` e `tasks.md`
produzidos nas respectivas etapas. Não manter uma cópia ativa em cada pasta.

Ao iniciar a primeira nova spec, indicar explicitamente o diretório `specs/004-nome-da-alteracao`
por `SPECIFY_FEATURE_DIRECTORY` no pedido à skill. Se usar o script de criação, passar `--number 4`.
A numeração automática padrão considera `specs/`, não os arquivos históricos de `docs/specs/`.
Depois, continuar a sequência e incluir links no índice de `docs/specs/README.md`.

`.specify/feature.json` aponta para a funcionalidade ativa e é ignorado pelo Git.
Trocar de branch não muda esse ponteiro automaticamente. O Git continua sendo operado
normalmente; nenhuma extensão adicional de Git ou execução automática foi instalada.

## Verificação da configuração

- `specify version`: versão 1.2.6 no Linux.
- `specify integration status`: integração Codex íntegra, sem arquivos gerenciados ausentes ou modificados.
- Resolução do template da constituição executada com sucesso.
- Skills e templates oficiais preservados; regras do projeto registradas separadamente.

Esta instalação não altera a aplicação, o banco ou o deploy. Não foi criada uma spec 004 nem
aprovada uma nova funcionalidade nesta etapa.

Referências: [instalação](https://github.github.io/spec-kit/installation.html),
[projetos existentes](https://github.github.io/spec-kit/guides/existing-projects.html) e
[integração Codex](https://github.github.io/spec-kit/integrations/codex.html).
