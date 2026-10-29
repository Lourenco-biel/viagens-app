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

## Atualização — publicação e SMTP

Registro atualizado em 29 de outubro de 2026, com base na conversa de publicação e configuração de e-mail. Os resultados abaixo foram relatados por Gabriel, exceto a verificação HTTP indicada.

Ambiente publicado: [Viagens App](https://viagens-app-three.vercel.app/), hospedado na Vercel e conectado ao Supabase remoto. SMTP configurado com Brevo, mantendo os planos gratuitos escolhidos para o projeto.

| Cenário | Resultado e evidência |
| --- | --- |
| Validações restantes do MVP e revisão anterior ao deploy | Gabriel informou que os passos 1 e 2 estavam concluídos; sem resultados individuais adicionais registrados |
| Publicação na Vercel | URL fornecida por Gabriel; o assistente verificou HTTP 200 na página de login e ausência do aviso de configuração indisponível |
| Configurar URLs de autenticação e acessar o site publicado | Gabriel confirmou sucesso após a orientação |
| Enviar recuperação de senha pelo Brevo | Primeira tentativa falhou; o painel mostrou bloqueio SMTP ativo e um IP não autorizado. Gabriel relatou sucesso após a orientação para autorizar o IP reconhecido |
| Cadastro com outro e-mail fora da equipe do Supabase, confirmação e acesso | Gabriel respondeu “funcionando” ao teste completo solicitado |

O SMTP inicialmente adiado foi configurado. As credenciais ficam no painel do Supabase, sem chave SMTP no código ou na Vercel. Os convites de viagem continuam sendo links compartilháveis, não mensagens enviadas pelo Brevo.

O bloqueio de IPs SMTP foi mantido ativo durante a orientação. Se houver nova falha de envio, conferir os logs de autenticação do Supabase e os IPs bloqueados no Brevo; a autorização realizada não comprova que o mesmo IP será usado em todas as tentativas futuras.

## Limites do registro

- O sucesso informado após liberar o IP confirma a resolução relatada do envio. A alteração da senha e um novo login com ela não receberam confirmação separada; registrar esse resultado quando executado explicitamente.
- Gabriel informou ter concluído os testes restantes antes de publicar, mas não há resultados individuais adicionais nesta conversa para cada caso de datas, confirmação/reabertura, exclusão e rotação de convite.
- Não foi registrado um novo teste completo de convites e permissões entre duas contas no domínio publicado; os testes detalhados acima ocorreram no aplicativo local com Supabase remoto.

Este registro não representa uma auditoria completa de segurança. As credenciais locais permanecem fora do Git. Novas alterações devem ser descritas em [specs](specs/README.md), com suas próprias evidências de validação.
