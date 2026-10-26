# Validação funcional do MVP — 26 de outubro de 2026

Ambiente: aplicativo local conectado ao projeto Supabase remoto. Gabriel operou o painel e os navegadores durante a sessão; os resultados manuais abaixo foram relatados por ele.

## Verificações realizadas pelo assistente

- O aplicativo carregou uma URL válida e uma chave do tipo publishable, sem expor os valores no registro.
- O serviço de autenticação respondeu com sucesso e informou e-mail e confirmação de e-mail habilitados.
- A página local de cadastro respondeu com sucesso e exibiu o formulário.

## Resultados manuais relatados por Gabriel

| Cenário | Resultado |
|---|---|
| Executar a migração no projeto novo | Sucesso |
| Ajustar senha mínima no painel | Configurada para 8 caracteres |
| Cadastrar conta principal e confirmar e-mail | Funcionou |
| Criar viagem e roteiro, depois recarregar | Dados permaneceram salvos |
| Abrir a viagem com a segunda conta antes do convite | Acesso bloqueado |
| Aceitar convite pela segunda conta | Viagem acessível e dois participantes exibidos |
| Votar e retirar voto como participante | Funcionou |
| Abrir a edição diretamente como participante | Edição bloqueada, com mensagem de exclusividade do organizador |
| Remover participante com voto e recarregar as duas janelas | Acesso revogado, um participante restante e voto removido |

A segunda conta foi criada em Authentication → Users, com confirmação individual pelo painel. O teste não exigiu desativar a confirmação de e-mail dos cadastros normais. Os convites do aplicativo são links compartilháveis, sem destinatário de e-mail específico.

## Pendências

- SMTP próprio: adiado por decisão de Gabriel. O envio padrão do Supabase fica limitado aos endereços da equipe do projeto.
- Recuperação de senha por e-mail com o projeto remoto.
- Confirmação e reabertura de votação, alterações de datas e rotação de convite no ambiente remoto: sem resultado manual registrado nesta sessão.
- Publicação, domínio e repetição dos fluxos de autenticação no endereço HTTPS definitivo.

Esta rodada confirma os fluxos descritos, sem representar uma auditoria completa de segurança ou a homologação de todos os cenários. As credenciais locais permanecem fora do Git.
