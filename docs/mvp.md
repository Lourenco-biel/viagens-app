# MVP — escopo e regras

## O que esta versão entrega

- Cadastro por e-mail e senha, confirmação, login, recuperação de senha e saída.
- Listagem, busca por nome/destino, filtros e paginação.
- Criar, revisar, salvar, editar e excluir viagens.
- Participação individual ou em grupo por convite.
- Sugestões de passeios por dia, horário, endereço e custo estimado.
- Votos por passeio e confirmação pelo organizador.
- Visual responsivo e componentes documentados no Storybook.

IA, chat, fotos, reservas, mapas e integrações com empresas ficam fora desta versão.

## Viagens

Nome de 3 a 80 caracteres, destino de 2 a 120, início e término obrigatórios. O término pode ser igual ao início. Datas passadas são aceitas. O status é derivado das datas usando o dia UTC: próxima, em andamento ou concluída.

O criador entra como organizador. Somente ele edita ou exclui a viagem. Excluir remove também participantes, passeios, votos e convites. A interface pede confirmação. Reduzir o período é impedido quando algum passeio ficaria fora dele.

Os filtros ficam na URL, e a API faz a busca e paginação. O banco normaliza acentos latinos comuns para a busca em português.

## Participantes e convites

Todos os participantes podem ver o roteiro e os nomes dos demais. Apenas o organizador gera convites e remove outros participantes. Um participante pode sair; o organizador não pode sair da própria viagem.

Há um convite ativo por viagem, válido por 7 dias. Gerar outro invalida o anterior. A pessoa precisa entrar na conta e aceitar explicitamente. Aceitar duas vezes não duplica a participação. Remover uma pessoa apaga seus votos e mantém suas sugestões; gere um novo convite se também quiser impedir que ela use o link antigo ainda válido.

O nome mostrado é o nome informado no cadastro, copiado no momento da entrada no grupo. Não há edição de perfil nesta versão.

## Roteiro e votação

Qualquer participante pode sugerir passeios dentro do período da viagem. O horário e o endereço são opcionais. Todos começam em votação. Cada pessoa pode votar uma vez em cada passeio e retirar seu próprio voto enquanto a votação estiver aberta. Pode apoiar vários passeios.

A decisão final é do organizador: ele confirma ou reabre a votação. A contagem não decide automaticamente; não há desempate automático. A confirmação mantém os votos, mas impede novos votos e retiradas.

O organizador pode remover qualquer passeio. O autor pode remover sua própria sugestão enquanto ela ainda estiver em votação. Para corrigir os dados de uma sugestão, esta versão permite removê-la e cadastrar outra; os votos anteriores não são transferidos.

Custos são informados pelo usuário, em reais, por pessoa, com duas casas decimais. O resumo soma apenas passeios confirmados. Não é cotação comercial, orçamento completo nem rateio de despesas.

O roteiro consulta atualizações a cada 30 segundos enquanto aberto. Não há chat ou sincronização em tempo real nesta versão.

## Arquitetura e estado

Next.js hospeda páginas e a API GraphQL Yoga em `/api/graphql`. Apollo guarda dados do servidor no cache; estado de formulários e mensagens usa hooks React. Não há store global adicional.

O schema Zod roda no cliente e no servidor. A API identifica a conta via Supabase Auth. O cliente Supabase do servidor usa os cookies do usuário, sem service_role. RLS e triggers mantêm as permissões e as principais regras mesmo ao acessar o banco pela API pública do Supabase.

GraphQL aceita POST JSON, recusa origens diferentes, exige autenticação e limita o corpo a 64 KiB. Respostas autenticadas não podem ser armazenadas em cache compartilhado. Antes de ampliar uso público, acompanhe tráfego, limites do provedor e abuso de cadastro.

## Homologação com Supabase real

- Criar duas contas, confirmar e-mail, sair e entrar novamente.
- Recuperar a senha por e-mail e entrar com a senha nova.
- Criar viagem na conta A; atualizar a página e confirmar persistência.
- Abrir o endereço com B antes de aceitar convite e confirmar acesso negado.
- Gerar convite com A, aceitar com B e conferir participantes nas duas contas.
- Sugerir passeio com B, votar nas duas contas, retirar um voto e confirmar com A.
- Confirmar que B não pode editar viagem nem confirmar passeio.
- Tentar passeio fora do período e reduzir datas sobre um passeio existente.
- Gerar outro convite e testar que o anterior deixou de funcionar.
- Remover B e conferir revogação de acesso e remoção dos votos.
- Excluir a viagem e conferir desaparecimento da listagem.
- Repetir login e convite no domínio HTTPS publicado.

## Situação da entrega

Projeto Supabase remoto conectado. Gabriel executou a migração e validou manualmente cadastro, persistência, convites, votação e restrições de acesso. O registro distingue as verificações automáticas dos resultados relatados em [validacao-mvp.md](validacao-mvp.md).

Os testes Playwright continuam usando serviços simulados, e os testes SQL executam a migração em PostgreSQL em memória. SMTP foi adiado por decisão de Gabriel; publicação e os demais itens de homologação ainda estão pendentes.
