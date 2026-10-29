# 002 — Navegação e modais de passeios

- Status: Rascunho
- Criada em: 2026-10-29
- Atualizada em: 2026-10-29
- Validação do escopo: pendente
- Implementação: não iniciada

## Problema e objetivo

Quero deixar a navegação mais clara e o roteiro menos carregado. Hoje, o link de voltar fica visualmente próximo demais do cabeçalho, só o nome da viagem é clicável no card e os formulários de passeios ocupam espaço no próprio roteiro.

Vou separar melhor o controle de voltar, permitir entrar pela área inteira do card e usar um modal para sugerir e editar passeios. Criar e editar a viagem continuam em páginas próprias, porque são fluxos com mais espaço para crescer.

## Escopo

### Incluído

- Trocar o link longo de retorno por uma seta, em uma faixa própria acima do conteúdo.
- Aplicar o mesmo padrão nas páginas de detalhes, criação e edição da viagem.
- Tornar todo o card da lista de viagens um link, com cursor de clique e indicação “Entrar na viagem”.
- Abrir a criação e a edição de passeios em um modal.
- Remover o formulário fixo abaixo do roteiro e o editor dentro do card.
- Adaptar mensagens, foco, cancelamento e testes para o novo fluxo.

### Fora do escopo

- Mudar a identidade visual, cores ou o cabeçalho global do aplicativo.
- Transformar a criação ou edição de viagens em modal.
- Alterar regras de votos, confirmação, custos ou permissões.
- Adicionar campos, páginas de passeio, novas funcionalidades ou serviços.
- Salvar rascunhos entre recarregamentos ou criar URLs específicas para os modais.

## Fluxo e interface

### Voltar

- Usar uma seta para a esquerda, sem o texto longo “Voltar para suas viagens”. O link terá nome acessível “Voltar para suas viagens” ou “Voltar ao roteiro”, conforme o destino, e dica ao receber foco ou passar o mouse.
- Colocar o controle no começo do conteúdo, alinhado à esquerda, fora do cabeçalho da viagem. Cabeçalho global, faixa de retorno e conteúdo devem ser três áreas visualmente distintas.
- Como referência inicial, manter 24 px entre a faixa de retorno e o conteúdo seguinte e ao menos 24 px abaixo do cabeçalho global. A seta fica acima do bloco da viagem, sem sobrepor ou aproximar-se da marca.
- A área de clique terá pelo menos 44 × 44 px e foco visível, inclusive no celular.
- Detalhes e criação retornam para `/viagens`; edição retorna para `/viagens/[id]`. Usar destinos explícitos para funcionar também ao abrir a página por um link externo, sem depender do histórico do navegador.

### Card da viagem

- Clicar no título, destino, datas, participantes ou espaço livre do card abre `/viagens/[id]`.
- Mostrar “Entrar na viagem” com uma seta no rodapé, mantendo a quantidade de participantes legível.
- Aplicar `cursor-pointer` em toda a área e um destaque discreto de borda ou fundo no hover. O foco pelo teclado deve destacar o card inteiro.
- O card terá um único link e uma única parada de Tab. “Entrar na viagem” é parte desse link, sem botão ou link aninhado.
- O nome acessível identifica a viagem, por exemplo “Entrar na viagem: Férias em Curitiba”. Preservar abertura em nova aba e os comportamentos nativos de um link.
- No celular, permitir quebra dos elementos do rodapé sem cortar textos ou gerar rolagem horizontal.

### Sugerir passeio

1. No cabeçalho da seção “Roteiro”, clicar em “Sugerir passeio”. No celular, o botão pode ocupar uma linha própria.
2. Abrir o modal com título “Sugerir passeio”, uma descrição curta e os campos já existentes: nome, dia, horário, local/endereço e custo por pessoa.
3. Manter os valores iniciais atuais: dia inicial da viagem, custo zero e demais campos vazios.
4. Validar os campos e enviar por “Adicionar sugestão”. Enquanto envia, exibir “Salvando...” e impedir novo envio e fechamento.
5. No sucesso, fechar o modal, atualizar o roteiro e anunciar “Passeio adicionado às sugestões”.

Quando não houver passeios, o estado vazio deve orientar a usar “Sugerir passeio”, sem dizer que há um formulário abaixo. A lista continua visível ao fundo enquanto o modal estiver aberto.

### Editar passeio

1. Clicar em “Editar passeio” no card que permite essa ação.
2. Abrir o mesmo componente de modal no modo de edição, com título “Editar passeio” e campos preenchidos.
3. Exibir dentro do modal o aviso de reinício dos votos e, quando confirmado, de retorno à votação e saída do total confirmado.
4. Salvar por “Salvar alterações”, mantendo a confirmação exigida pela spec 001 quando houver alteração efetiva e votos ou confirmação.
5. No sucesso, fechar, atualizar a posição e os dados do passeio, os votos e o total confirmado. Anunciar o resultado na página.

Salvar sem mudanças continua preservando votos, status e versão. O modal fecha com a mensagem “Nenhuma alteração para salvar”.

### Fechamento, falhas e acessibilidade

- Só um modal de passeio pode estar aberto por vez. O fundo fica indisponível para interação e a rolagem da página é bloqueada enquanto ele estiver aberto.
- Oferecer “Cancelar” e um botão de fechar com nome acessível. Escape e clique no fundo seguem a mesma regra de cancelamento.
- Sem mudanças nos valores, fechar diretamente. Com alterações, pedir confirmação de descarte; desistir do descarte mantém os campos e o modal. Se os valores voltarem aos iniciais, não pedir confirmação desnecessária.
- Durante uma requisição de salvamento, bloquear todos os caminhos de fechamento. Ao falhar, liberar as ações novamente.
- Erros de campos aparecem junto aos campos. Falhas de rede mantêm o modal aberto com os dados digitados e permitem tentar novamente.
- Polling não substitui o rascunho. Um conflito mantém os dados e oferece “Carregar versão atual”, com confirmação antes de descartá-los, conforme a spec 001.
- Perda de permissão ou passeio removido deve gerar uma mensagem clara, sem recriar o passeio ou informar sucesso. Permitir fechar o modal.
- Ao abrir, mover o foco para o primeiro campo; Tab e Shift+Tab ficam dentro do modal. Título, descrição e mensagens precisam ser acessíveis a leitores de tela.
- Ao fechar, devolver o foco ao botão que abriu o modal. Se o passeio mudar de dia, localizar o mesmo botão pela identidade do passeio; se o botão não existir mais, usar “Sugerir passeio” como retorno.
- No desktop, usar largura máxima próxima de 640 px. No celular, respeitar as margens e a altura disponível, com rolagem interna para alcançar todos os campos e ações, inclusive com o teclado aberto.

## Regras de negócio e permissões

As regras da [spec 001](001-edicao-de-passeios.md) continuam valendo: participantes sugerem e votam, o autor edita sua sugestão em votação e o organizador edita qualquer passeio. Alterações efetivas zeram votos e reabrem passeios confirmados; um salvamento equivalente não altera esses dados.

Esta proposta substitui apenas a decisão de apresentar o editor dentro do card. Os controles visuais seguem as permissões existentes, e a autorização continua sendo validada no servidor e no banco.

## Componentes, API e dados

- Reaproveitar `ActivityForm` nos dois modos e criar um componente de modal de passeio com estado local de criação/edição. Evitar duplicar formulário, validação ou mutations.
- Usar o Dialog do shadcn compatível com o Base UI já utilizado no projeto. Reaproveitar os ícones do Lucide e os tokens do tema.
- `Itinerary` controla abertura, passeio selecionado, chamadas existentes e mensagens de resultado. `ActivityCard` mantém a ação de editar, mas não renderiza mais o formulário.
- Ajustar `TripCard` e criar um controle de retorno reutilizável para as três páginas afetadas.
- Manter `ADD_ACTIVITY`, `UPDATE_ACTIVITY`, `expectedVersion`, Zod e a atualização do cache Apollo. Não introduzir Zustand ou outro estado global para abrir um modal.
- Não há alteração prevista no contrato GraphQL, nas tabelas, nas políticas RLS ou nas variáveis de ambiente. Não é necessária uma nova migração para esta spec.

## Critérios de aceite

- [ ] As três páginas usam a seta de retorno, com destino correto, nome acessível, foco visível e espaçamento separado dos cabeçalhos.
- [ ] Abrir uma página diretamente e usar a seta leva ao destino definido, mesmo sem histórico anterior no app.
- [ ] Qualquer área do card abre a viagem; o card mostra cursor de clique e “Entrar na viagem”.
- [ ] Cada card tem um único link acessível, funciona por teclado e permite abrir em nova aba.
- [ ] “Sugerir passeio” abre um modal; o formulário não fica mais no fim da página.
- [ ] “Editar passeio” abre o modal preenchido; nenhum editor é expandido dentro do card.
- [ ] Criação e edição de viagens continuam em páginas próprias.
- [ ] Cancelar, fechar, Escape e clique no fundo respeitam a confirmação de descarte e o bloqueio durante envio.
- [ ] Salvar atualiza a página e fecha o modal; falha de validação, rede ou conflito mantém os valores para correção.
- [ ] Avisos, permissões, reinício de votos, reabertura e salvamento sem mudanças continuam seguindo a spec 001.
- [ ] Polling não apaga o rascunho; apenas a recarga explícita substitui os campos após conflito.
- [ ] Foco fica dentro do modal e retorna ao controle correto ao fechar, inclusive após mudança de dia ou remoção do passeio.
- [ ] No celular, os campos e as ações são alcançáveis, sem rolagem horizontal, inclusive com o teclado aberto.

## Validação

Vou revisar primeiro esta proposta. Depois da implementação, registrar os resultados abaixo sem confundir respostas simuladas com testes no ambiente publicado.

| Cenário | Método e ambiente | Resultado / evidência |
| --- | --- | --- |
| Card inteiro, retorno e abertura em nova aba | Playwright desktop e celular | Não executado |
| Criar, editar, cancelar, salvar e manter dados após erro | Adaptar os cenários existentes do Playwright para o modal | Não executado |
| Conflito, polling, permissões, votos e confirmação | Regressão da spec 001 e testes automatizados existentes | Não executado |
| Tab, Shift+Tab, Escape, foco e bloqueio durante envio | Playwright e revisão manual de acessibilidade | Não executado |
| Card e modal nos modos criação, edição, erro e conflito | Storybook e revisão visual | Não executado |
| Espaçamento do retorno e celular com teclado aberto | Revisão visual no navegador e em um celular real | Não executado |
| Qualidade e compatibilidade | Lint, TypeScript, testes e builds do app e Storybook | Não executado |
| Fluxo publicado com duas contas | Supabase e Vercel, usando dados de teste | Não executado |

## Publicação e compatibilidade

A edição da spec 001 e sua migração precisam estar disponíveis no ambiente de destino. Esta alteração não precisa de migração adicional, novo serviço ou configuração de SMTP.

Depois dos testes, publicar o frontend e validar os fluxos no domínio do app. Se necessário, voltar ao deploy anterior sem alterar os dados. Atualizar a documentação da interface quando esta spec for entregue.

## Decisões

- Quero a seta em uma faixa própria para separar navegação e conteúdo.
- Quero que o card inteiro funcione como entrada para a viagem, com uma ação visível no rodapé.
- Vou usar modal para passeios porque é uma ação pontual dentro do roteiro. A viagem mantém suas páginas de criação e edição.
- Vou manter as regras da edição atual e mudar apenas sua apresentação.
- Falta revisar esta proposta antes de iniciar a implementação. Medidas de espaçamento e largura são referências para conferir visualmente na entrega.

## Entrega

- Código da aplicação: não alterado nesta etapa.
- Publicação: não realizada para esta spec.
- Próximo passo: validar o escopo e os critérios de aceite.
