# 001 — Edição de passeios

- Status: Pronta — aprovada por Gabriel em 2026-10-29
- Criada em: 2026-10-29
- Atualizada em: 2026-10-29
- Responsável pela validação: Gabriel
- Implementação: não iniciada

## Resumo aprovado

Permitir corrigir um passeio no próprio roteiro, sem excluí-lo. Gabriel aprovou esta spec em 29 de outubro de 2026, incluindo as decisões abaixo:

| Decisão | Regra aprovada | Consequência |
| --- | --- | --- |
| Quem edita | Organizador edita qualquer passeio; participante edita apenas a própria sugestão em votação | Mantém o controle do roteiro confirmado com o organizador |
| O que acontece com os votos | Qualquer alteração efetiva nos campos editáveis zera todos os votos daquele passeio | Ninguém permanece apoiando uma proposta diferente da que votou; até correções pequenas exigem novos votos |
| Passeio confirmado | Quando editado, volta automaticamente para “Em votação” | Sai do total de custos confirmados e precisa de nova confirmação do organizador |

Salvar sem modificar os dados não zera votos nem altera o status. A aprovação define o comportamento desejado; a implementação permanece como etapa posterior.

## Problema e objetivo

Hoje, corrigir uma sugestão exige removê-la e cadastrar outra. Isso dificulta ajustes de horário, endereço e custo, além de trocar a identidade do passeio.

Exemplo: o grupo sugeriu uma visita ao museu às 14h, mas o horário correto é 15h. Quem tiver permissão poderá abrir “Editar passeio”, ajustar o horário e salvar. O passeio mantém seu identificador e autoria; os votos serão reiniciados conforme as regras propostas.

## Escopo

### Incluído

- Editar nome, dia, horário, local/endereço e custo estimado por pessoa.
- Formulário preenchido com os dados atuais, dentro do card no roteiro.
- Salvar e cancelar, com mensagens de validação e de resultado.
- Aplicar as permissões no servidor e no banco.
- Reiniciar votos e reabrir passeios confirmados quando os dados mudarem.
- Atualizar o agrupamento por dia, a ordenação e o custo total dos confirmados.
- Rejeitar uma edição desatualizada para evitar sobrescrever mudanças de outra pessoa.

### Fora do escopo

- Histórico de versões, desfazer alterações e registro visual de quem editou.
- Notificações, e-mails, comentários e chat.
- Edição em lote, arrastar passeios ou criar uma página exclusiva de edição.
- Alterar autor, viagem de origem, moeda ou regras de confirmação manual.
- Alterar as regras de criação, remoção e reabertura manual, salvo os ajustes de integridade necessários à edição.
- Novos serviços ou bibliotecas; usar a stack existente.

## Regras de negócio e permissões

### Permissões aprovadas

| Pessoa | Passeio em votação | Passeio confirmado |
| --- | --- | --- |
| Organizador | Pode editar qualquer passeio | Pode editar; uma alteração efetiva reabre a votação |
| Autor, ainda participante | Pode editar a própria sugestão | Não pode editar |
| Outro participante | Não pode editar | Não pode editar |
| Pessoa sem acesso ou removida | Não pode editar | Não pode editar |

O organizador pode editar uma sugestão cujo autor saiu da viagem, sem assumir sua autoria. A situação da viagem (próxima, em andamento ou concluída) não cria um bloqueio adicional nesta entrega, seguindo o comportamento atual de gerenciamento do roteiro.

### Campos e limites

| Campo | Regra |
| --- | --- |
| Nome | Obrigatório, de 3 a 120 caracteres após remover espaços nas extremidades |
| Dia | Data válida dentro do período atual da viagem, incluindo início e término |
| Horário | Opcional; quando informado, formato de 24 horas `HH:mm` |
| Local/endereço | Opcional, até 200 caracteres após remover espaços nas extremidades |
| Custo estimado | Obrigatório, entre R$ 0,00 e R$ 1.000.000,00, com até duas casas decimais; por pessoa |

Esses limites já existem na criação e devem ser compartilhados com a edição. Campo de custo vazio não significa zero. Limpar o horário salva `null`; limpar o endereço salva texto vazio.

### Alterações, votos e confirmação

- Comparar os cinco campos após normalização. Espaços removidos pelo schema ou diferenças equivalentes de representação, como `10` e `10.00`, não contam como alteração.
- Qualquer diferença efetiva, inclusive no título ou endereço, zera todos os votos do passeio. Não tentar classificar automaticamente se uma correção é “pequena”.
- Se estava confirmado, uma alteração efetiva muda o status para `proposed`, retirando seu custo da soma dos confirmados. A confirmação futura permanece uma ação explícita do organizador, sem quantidade mínima de votos.
- Sem alteração efetiva, manter os votos, o status e o custo total. Informar “Nenhuma alteração para salvar.”
- Preservar identificador, viagem de origem, autor e data de criação. Não permitir editar status pelo formulário.
- Atualizar os dados, limpar votos e reabrir a votação em uma única transação. Se ocorrer erro, nada dessa operação deve persistir parcialmente.
- Cancelar não altera dados, votos ou status no servidor.

### Edições concorrentes e perda de acesso

- Validar novamente acesso, status, período da viagem e versão do passeio no momento de salvar.
- Se outra pessoa editou, confirmou ou reabriu o passeio desde a abertura do formulário, rejeitar o envio com uma mensagem de conflito. Não sobrescrever silenciosamente nem reenviar automaticamente.
- Manter os valores digitados em caso de conflito e oferecer “Carregar versão atual”. Essa ação descarta o rascunho após confirmação e preenche o formulário com os dados atuais.
- Se o passeio foi removido ou o usuário perdeu acesso, rejeitar o envio; não recriar o passeio. Informar a situação sem revelar dados de outra viagem.
- Votos concorrentes devem respeitar a ordem da transação: votos registrados antes da alteração são removidos; votos registrados após o commit pertencem à versão atual. Não pode restar um voto anterior por uma corrida entre edição e votação.
- O polling existente não deve substituir campos que a pessoa está preenchendo.

## Fluxo e interface

1. No detalhe da viagem, o card exibe “Editar passeio” apenas para quem tiver permissão.
2. Ao clicar, abre o formulário dentro do próprio card, com os cinco campos preenchidos. Apenas um passeio fica em edição por vez; é necessário salvar ou cancelar antes de editar outro.
3. O formulário apresenta o aviso permanente: “Ao alterar este passeio, os votos serão zerados.” Para um passeio confirmado, acrescentar: “Ele voltará para votação e sairá do total de custos confirmados.”
4. Ao salvar uma alteração em passeio com votos ou confirmado, pedir confirmação com o impacto atualizado conhecido pela tela. Se novos votos surgirem depois, a regra transacional continua removendo todos os votos anteriores ao salvamento, como informado no aviso.
5. Durante o envio, desabilitar campos e ações do formulário para evitar envios duplicados. Não aplicar sucesso otimista.
6. Em sucesso, fechar o formulário e mostrar “Passeio atualizado. A votação foi reiniciada.” Reposicionar o card se o dia ou horário mudou e atualizar o resumo de custos.
7. Em erro de campo, exibir a mensagem junto ao campo; em falha de conexão, manter o formulário e permitir nova tentativa. Ao cancelar com alterações locais, pedir confirmação de descarte.

Reutilizar `ActivityForm` para criação e edição, com valores iniciais e textos adequados a cada modo. Na criação, continuar limpando os campos após sucesso; na edição, fechar após sucesso. Separar o card em `ActivityCard` para concentrar a apresentação e as ações de um passeio, mantendo `Itinerary` responsável pela organização do roteiro. Nomes de props e detalhes internos serão definidos na implementação.

Manter os componentes shadcn, estilos e comportamento responsivo existentes. Inputs precisam de labels, erros associados por `aria-describedby` e navegação por teclado. Ao abrir, levar o foco ao primeiro campo; ao fechar, devolver ao botão de edição do card, inclusive se ele mudar de posição. Anunciar sucesso com `role="status"`.

## API e dados

### GraphQL e serviço

Contrato definido na spec:

```graphql
updateActivity(id: ID!, input: ActivityInput!, expectedVersion: Int!): Trip!
```

- Reutilizar `ActivityInput` e `activitySchema`; validar UUID e versão inteira positiva no servidor.
- Adicionar `version: Int!` a `Activity` e ao fragmento de detalhes usado pelo Apollo.
- Implementar `updateActivity` no serviço de viagens, usando a sessão autenticada, sem service role.
- Retornar o detalhe atualizado da viagem, seguindo as mutações existentes, para atualizar campos, votos e resumo no cache Apollo.
- Distinguir validação (`BAD_USER_INPUT`), falta de permissão (`FORBIDDEN`), ausência ou falta de acesso (`NOT_FOUND`), conflito (`CONFLICT`) e falha operacional (`OPERATION_FAILED`). Erros de campo devem chegar ao formulário; não exibir detalhes SQL.
- Uma nova tentativa após falha de rede não pode apagar votos novamente de uma versão que já foi salva: a versão esperada deve impedir a repetição da alteração.

### Banco e migração

Atualmente, a política `activities_edit` permite UPDATE apenas ao organizador, e não existe controle de versão. A implementação precisa de uma nova migração incremental; não editar a migração inicial já aplicada.

- Adicionar `version` inteira, não nula, inicialmente `1` para registros existentes e novos. Alterações efetivas de conteúdo ou status incrementam a versão; votos isolados e salvamentos sem alteração não incrementam.
- Ajustar permissões para permitir ao autor editar sua sugestão em votação. Proteger autor, identificador, viagem de origem, data de criação e versão contra alterações arbitrárias.
- Garantir que um participante não consiga confirmar o passeio, editar um confirmado ou contornar regras usando diretamente a Data API do Supabase.
- Centralizar no banco a atualização atômica de conteúdo, status e votos, por função transacional e/ou triggers com permissões restritas. A escolha exata será feita na implementação, preservando a mesma regra para todos os caminhos de escrita.
- Coordenar edição, votação e alteração de status para cumprir as regras de concorrência. Manter a proteção existente contra dias fora do período da viagem.
- Se houver função com `SECURITY DEFINER`, validar explicitamente a identidade e as permissões, limitar seu escopo e fixar o `search_path`, conforme o padrão existente.

## Critérios de aceite

- [ ] Organizador consegue editar uma sugestão de outro participante, mantendo autoria e identificador.
- [ ] Autor participante consegue editar a própria sugestão em votação; outro participante não consegue, inclusive por chamada direta à API.
- [ ] Autor participante não consegue editar passeio confirmado. Organizador consegue editar e o passeio volta para votação.
- [ ] Alterar qualquer campo efetivamente zera votos; salvar valores equivalentes não modifica votos nem status.
- [ ] Editar passeio confirmado retira seu custo do total; confirmar novamente inclui o novo valor.
- [ ] Campos inválidos e dia fora do período impedem o salvamento, sem mudanças parciais ou perda de votos.
- [ ] Limpar horário e endereço funciona; custo vazio é inválido e custo zero é aceito.
- [ ] Alterar dia ou horário atualiza a posição no roteiro e persiste após recarregar a página.
- [ ] Cancelar preserva os dados originais; falha de rede preserva os valores digitados.
- [ ] Atualização por polling não apaga o rascunho. Edição/status concorrente gera conflito e permite carregar a versão atual explicitamente.
- [ ] Voto concorrente, repetição de uma requisição e perda de acesso não deixam estado inconsistente nem permitem gravação indevida.
- [ ] Acesso direto ao banco pelas permissões de usuário não permite contornar as regras de autoria, status, votos ou campos protegidos.
- [ ] Fluxo funciona no celular e por teclado; criação, votação, confirmação, reabertura e remoção existentes continuam funcionando.

## Validação

Nenhum teste desta funcionalidade foi executado: esta entrega é somente a especificação.

| Cenário | Método e ambiente | Resultado / evidência |
| --- | --- | --- |
| Contrato GraphQL, validação e erros de versão | Jest; schema e serviço com dependências controladas | Não executado |
| Permissões, imutabilidade, votos, status, no-op e rollback | Testes SQL com PGlite, aplicando migração inicial e nova migração | Não executado |
| Conflitos e corridas entre sessões distintas | Teste de integração em PostgreSQL com conexões independentes, em ambiente de teste; PGlite isolado não basta para comprovar concorrência real | Não executado |
| Formulário preenchido, avisos, cancelamento e erros | Storybook, estados de criação e edição | Não executado |
| Organizador, autor e outro participante; edição, erro e conflito | Playwright desktop e celular com respostas GraphQL simuladas | Não executado |
| Persistência e permissões reais com duas contas | Homologação manual no Supabase, seguida de teste no domínio publicado | Não executado |

Executar lint, typecheck, testes relevantes e builds do app e Storybook antes de publicar. Registrar os resultados efetivamente obtidos, distinguindo simulação de verificação no banco real.

## Publicação e compatibilidade

1. Após validação da spec e implementação, testar a nova migração com dados existentes e validar compatibilidade com a versão atual do aplicativo.
2. Aplicar a migração antes do deploy que depende de `version` e da operação de edição.
3. Publicar o app e verificar os critérios de aceite no ambiente publicado com dados de teste.
4. Atualizar as regras vigentes em `docs/mvp.md` apenas quando a funcionalidade estiver entregue.

Não requer serviço pago, novas variáveis de ambiente ou mudança no SMTP. Em caso de falha do frontend, voltar ao deploy anterior, mantendo a migração aditiva se compatível. Não reverter a estrutura de forma destrutiva nem tentar restaurar votos apagados; qualquer problema no banco exige correção incremental. A compatibilidade do rollback deve ser verificada antes da publicação.

## Decisões aprovadas por Gabriel

- [x] Organizador edita todos; autor edita apenas a própria sugestão em votação.
- [x] Zerar votos em qualquer mudança efetiva, inclusive correção de texto, aceitando o custo de votar novamente.
- [x] A edição de um confirmado o devolve à votação e o retira do custo confirmado até nova confirmação.
- [x] Formulário dentro do card, sem nova página ou modal de edição.

Aprovação registrada nesta conversa em 2026-10-29: “ta aprovado”. Os critérios de aceite continuam desmarcados porque a implementação e os testes ainda não foram realizados.

Se uma decisão mudar, revisar os critérios de aceite e os impactos técnicos antes de iniciar o desenvolvimento.

## Entrega

- Especificação: aprovada, pronta para implementação.
- Código e migração: não implementados.
- Publicação: não realizada para esta funcionalidade.
- Decisões de produto pendentes: nenhuma nesta versão da spec.
