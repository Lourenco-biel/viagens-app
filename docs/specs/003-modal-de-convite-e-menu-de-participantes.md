# 003 — Modal de convite e menu de participantes

- Status: Em validação
- Criada em: 2026-11-03
- Atualizada em: 2026-11-03
- Validação do escopo: concluída
- Implementação: concluída localmente

## Objetivo

- O aceite do convite deve aparecer em um modal ao acessar o link com a sessão autenticada. Sem sessão, o modal deve abrir após o login.
- Na visão do organizador, a lista de participantes deve exibir um menu de três pontos ao lado de cada participante removível, com a opção “Remover participante”, substituindo o botão abaixo do nome.

## Escopo

### Incluído

- Abrir automaticamente o modal de aceite ao acessar um convite com a sessão autenticada.
- Preservar o retorno ao convite depois de entrar ou criar uma conta.
- Tratar aceite, cancelamento, envio e erros dentro desse fluxo.
- Colocar o menu de três pontos ao lado dos participantes que o organizador pode remover.
- Confirmar a remoção em um diálogo, mantendo a lista livre de controles expandidos abaixo dos nomes.
- Cobrir navegação por teclado, foco, celular e regressão de permissões.

### Fora do escopo

- Convites por e-mail, notificações ou aprovação posterior pelo organizador.
- Novos papéis administrativos, transferência de organização ou remoção em lote.
- Mudar validade, renovação ou compartilhamento dos links.
- Criar uma consulta de prévia da viagem para quem ainda não participa.
- Alterar o fluxo “Sair da viagem” do próprio participante.

## Regras de negócio e permissões

- “Administrador” nesta spec é o organizador da viagem, identificado por `trip.isOwner`.
- Abrir o link ou o modal não adiciona ninguém à viagem. A participação só é criada após clicar em “Aceitar convite” e o servidor confirmar.
- A pessoa precisa estar autenticada para aceitar. Um convite válido aceito novamente não duplica a participação.
- Continuam valendo os sete dias de validade e a invalidação do convite anterior ao gerar outro.
- O token é validado no servidor ao aceitar, como já acontece hoje. Abrir o modal não significa que o convite está válido.
- Fechar o modal não recusa nem invalida o link; a pessoa pode abri-lo novamente enquanto estiver válido.
- Somente o organizador pode remover outros participantes. Ele não pode remover a si mesmo.
- A remoção continua revogando acesso e apagando os votos da pessoa, sem apagar suas sugestões.
- Remover alguém não invalida automaticamente o convite existente. A possibilidade de gerar outro link continua seguindo a regra atual.
- As permissões continuam sendo verificadas na API e no banco, além da interface.

## Fluxo e interface

### Aceitar convite em modal

1. Manter o endereço compartilhável `/convites/[token]`, incluindo acesso direto e recarregamento.
2. Se a pessoa não estiver logada, seguir para o login preservando o convite em `next`. Depois de autenticar, voltar ao mesmo endereço e abrir o modal. Se passar pelo cadastro e confirmação de e-mail, preservar esse destino também.
3. Com sessão ativa, abrir automaticamente um modal com título “Vamos viajar juntos?”.
4. Mostrar a explicação atual: ao aceitar, a pessoa entra na viagem, pode sugerir passeios e votar, e seu nome fica visível para o grupo.
5. Oferecer “Aceitar convite”, “Agora não” e um botão de fechar com nome acessível.
6. Ao aceitar, mostrar “Entrando...” e bloquear novo envio e fechamento até a resposta.
7. No sucesso, atualizar o cache da lista e navegar para o roteiro da viagem com substituição de histórico, como no fluxo atual.

O fundo será a estrutura autenticada do aplicativo com uma área neutra de convite. Não mostrar o roteiro, participantes ou outros dados privados da viagem antes do aceite. O modal terá texto genérico; esta versão não acrescenta prévia com nome, destino ou organizador.

“Agora não”, X, Escape e clique fora fecham o fluxo e levam a `/viagens`, sem chamar a mutation de aceite. Como não há campos para preencher, não é necessária confirmação de descarte.

Se o link estiver expirado, invalidado ou a viagem não existir, mostrar a mensagem de convite indisponível no modal após a tentativa. Não navegar para o roteiro nem criar participação. Em falha de rede, manter o modal aberto, mostrar erro e permitir tentar novamente. Um token com formato inválido mantém o tratamento de rota não encontrada existente.

### Menu dos participantes

- Na visão do organizador, cada participante removível terá nome e papel à esquerda e um botão de três pontos verticais à direita, na mesma linha.
- O nome pode quebrar linha; o botão mantém seu tamanho e não fica sobre o texto. Usar área de toque de pelo menos 44 × 44 px.
- O menu começa com uma única opção: “Remover participante”, com aparência de ação destrutiva.
- Não mostrar o menu na linha do organizador nem mostrar ações de remover outras pessoas para participantes comuns. Não criar menus vazios.
- Usar o identificador do participante para selecionar quem será removido; nomes iguais não podem confundir a operação.
- Manter a identificação “(você)” e os rótulos “Organizador” e “Participante”.

### Confirmar a remoção

1. Selecionar “Remover participante” fecha o menu e abre um diálogo de confirmação separado dele.
2. Mostrar “Remover [nome] da viagem?” e explicar que a pessoa perderá acesso e votos, mas seus passeios permanecerão.
3. Oferecer “Cancelar” e “Remover participante”. O foco inicial fica em “Cancelar”.
4. Ao confirmar, mostrar “Removendo...” e bloquear envios repetidos e fechamento enquanto a requisição estiver em andamento.
5. No sucesso, fechar o diálogo, atualizar a lista, a contagem e os votos no roteiro e anunciar “Participante removido”.
6. Em erro, manter a confirmação aberta com a mensagem e permitir tentar novamente ou cancelar. Não anunciar sucesso nem remover a linha antes da confirmação do servidor.

Cancelar a confirmação não altera os dados e devolve o foco ao botão de três pontos. Depois da remoção, como esse botão deixa de existir, mover o foco para o título da seção “Participantes”. Usar o mesmo retorno se a linha desaparecer por atualização de outra sessão. O diálogo guarda o identificador selecionado para não trocar de alvo quando a lista atualizar.

## Acessibilidade e celular

- Reutilizar Dialog/AlertDialog e Dropdown Menu do shadcn compatíveis com o Base UI do projeto.
- Modais com título, descrição, foco contido e fundo indisponível para interação. Mensagens de erro e sucesso devem ser anunciadas.
- Ao abrir o convite, dar foco a uma ação dentro do modal. Ao cancelar e navegar, garantir um destino de foco coerente na página de viagens.
- Botão dos três pontos com nome acessível “Ações de [nome]”, estado de expansão e foco visível.
- Menu operável por Enter/Espaço e setas; Escape fecha e devolve o foco ao botão. A confirmação só aparece após selecionar a opção.
- A confirmação de remoção deve permanecer aberta após o fechamento do menu, sem depender de conteúdo que será desmontado.
- No celular, manter os controles alcançáveis e os diálogos dentro da altura disponível, com rolagem interna quando necessário e sem rolagem horizontal.

## Componentes, API e dados

- Adaptar `AcceptInvite` e a página `/convites/[token]` para apresentar o aceite no modal, preservando o destino de autenticação.
- Adaptar `TripMembers` e separar o menu de ações do participante e a confirmação, sem duplicar a mutation de remoção.
- Reaproveitar `ACCEPT_INVITE`, `REMOVE_MEMBER`, a atualização do cache Apollo e a consulta dos detalhes após remoção.
- Manter estado local para o participante selecionado e os diálogos; não adicionar store global.
- Não há mudança prevista de contrato GraphQL, schemas, tabelas, RLS, migrações, SMTP ou variáveis de ambiente.
- O modal de convite não deve chamar a mutation ao montar, em efeitos ou ao reabrir. O aceite exige ação explícita.

## Critérios de aceite

Os itens marcados foram verificados localmente pelos métodos abaixo; a conferência no domínio publicado permanece pendente.

- [x] Acessar um convite autenticado abre o modal automaticamente, inclusive por acesso direto e recarregamento.
- [x] Sem sessão, o login/cadastro preserva o convite e retorna ao modal antes de qualquer aceite.
- [x] Abrir ou cancelar o modal não cria participação; apenas “Aceitar convite” envia a operação.
- [x] Aceitar convite válido abre o roteiro; repetir o aceite de um link válido não duplica a pessoa.
- [x] Convite indisponível e erro de rede permanecem no modal com mensagem e ações de recuperação, sem acesso indevido.
- [x] X, Escape, clique fora e “Agora não” retornam às viagens; durante o envio, ficam bloqueados.
- [x] Na visão do organizador, os três pontos ficam ao lado do nome e substituem o botão abaixo dele.
- [x] O menu só aparece para participantes removíveis e mostra “Remover participante”.
- [x] Selecionar a opção abre uma confirmação identificando a pessoa; cancelar preserva participação e votos.
- [x] Confirmar remove a pessoa correta, atualiza contagem e votos e mantém seus passeios.
- [x] Erros de remoção não fecham a confirmação nem removem a linha indevidamente.
- [x] Participantes comuns não removem terceiros; o organizador não pode remover a si mesmo, inclusive por chamadas diretas.
- [x] Menus e modais funcionam por teclado, com retorno de foco após cancelar, remover ou atualizar a lista.
- [x] Nome comprido, nomes iguais e tela estreita não quebram o layout nem trocam o alvo da remoção.

## Validação

Validação local em 2026-11-03, no WSL Ubuntu com Node 24. Os testes de interface usam Chromium desktop e celular emulado, com autenticação e GraphQL simulados. Os testes de banco aplicam as migrações em PGlite isolado.

| Cenário | Método e ambiente | Resultado |
| --- | --- | --- |
| Link direto, login, cadastro e retorno ao convite | Playwright com autenticação simulada | Aprovado; destino enviado no cadastro e preservado no login. Confirmação por e-mail real pendente |
| Aceite explícito, cancelamento, expiração, erro e repetição | Playwright e regressão dos testes existentes de convite | Aprovado; idempotência também verificada no banco |
| Menu, confirmação, atualização de participantes e votos | Playwright desktop e celular | Aprovado |
| Permissões e remoção por identificador | 17 testes de banco e teste de interface com nomes iguais | Aprovado; remoção de terceiros e saída do organizador bloqueadas no banco |
| Foco, teclado, erros e requisições pendentes | Playwright; estados documentados no Storybook | Aprovado; inclui linha removida durante a confirmação |
| Layout com nomes longos e tela estreita | Capturas de desktop e celular, revisão visual e teste de largura | Aprovado em emulação; aparelho físico pendente |
| Qualidade e compatibilidade | Lint, TypeScript, 52 testes Jest e builds do app e Storybook | Aprovado; Storybook mantém avisos de empacotamento de dependências com `use client`, sem erro de build |
| Convite e revogação de acesso com duas contas | Supabase e domínio publicado | Pendente após publicação |

E2E: 59 cenários aprovados e 1 ignorado por ser exclusivo de desktop. A execução completa teve duas falhas no novo teste de cadastro, que preenchia o formulário antes da navegação terminar. Após aguardar a URL de login, os 16 cenários de autenticação e participantes passaram novamente nos dois tamanhos de tela.

## Publicação e compatibilidade

Os links existentes continuam funcionando no mesmo endereço. Não é necessária nova migração ou configuração de serviços. Depois dos testes, publicar o código e conferir convite e remoção com duas contas. O retorno ao deploy anterior não exige mudança no banco.

## Entrega

- Código da aplicação: modal de convite, menu de participantes e confirmação de remoção implementados.
- Storybook: histórias de convite, envio, erro, remoção e nome comprido adicionadas.
- Commits: `6ec3daf` (modal de convite) e `c499b0f` (menu e confirmação de remoção).
- Publicação: não realizada para esta spec.
- Próximo passo: publicar e validar convite, confirmação de e-mail e revogação de acesso com duas contas no domínio real.
