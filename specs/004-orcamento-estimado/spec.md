# Especificação da funcionalidade: Orçamento estimado da viagem

**Diretório da funcionalidade**: `specs/004-orcamento-estimado`

**Branch de trabalho**: `codex/setup-spec-kit`

**Criada em**: 2026-11-04

**Status**: Concluída com homologação manual relatada — implementação e testes locais concluídos; correção do rascunho T039 validada em 2026-11-10; homologação manual com Supabase real relatada como concluída por Gabriel em 2026-11-11 (T036/T040; origem e limites no quickstart). Escopo autorizado por Gabriel em 2026-11-06 pelo pedido `$speckit-implement`. Implementação versionada nesta branch; envio ao origin autorizado em 2026-11-11. Nenhum deploy manual executado nesta etapa. Evidências em [quickstart.md](quickstart.md).

**Entrada**: Definir um orçamento estimado por pessoa e compará-lo com o custo dos passeios confirmados.

## Cenários de uso e testes

### História 1 — Gerenciar o orçamento da viagem (Prioridade: P1)

O organizador define, edita ou remove o orçamento por pessoa nos detalhes da viagem. Os demais participantes consultam o valor salvo.

**Justificativa da prioridade**: Estabelece a referência de planejamento e o controle de quem pode alterá-la.

**Teste independente**: Acessar uma viagem como organizador e como participante; definir, editar e remover um orçamento, recarregando a página após cada operação.

**Cenários de aceite**:

1. **Dada** uma viagem sem orçamento, **quando** o organizador abre a definição no resumo de custos, informa R$ 500,00 e salva, **então** o modal fecha, o resultado é informado e o valor aparece no resumo e permanece após recarregar a página.
2. **Dado** um orçamento de R$ 500,00, **quando** o organizador abre a edição, **então** o modal apresenta o valor salvo; ao alterá-lo para R$ 600,50 e salvar, o novo valor permanece após recarregar a página.
3. **Dado** um orçamento definido, **quando** o organizador solicita sua remoção, **então** é solicitada confirmação; cancelar preserva o orçamento e confirmar retorna ao estado sem orçamento, inclusive após recarregar, preservando passeios, custos e votos.
4. **Dada** uma viagem acessível a um participante comum, **quando** ele consulta os detalhes, **então** visualiza o orçamento ou sua ausência, sem ações de definição, edição ou remoção.
5. **Dado** um participante comum, **quando** tenta definir, editar ou remover o orçamento por acesso direto à API, **então** a operação é rejeitada e o valor salvo permanece inalterado.
6. **Dada** uma pessoa não autenticada ou sem acesso à viagem, **quando** tenta consultar ou alterar seu orçamento, **então** o acesso é negado conforme as permissões existentes.

### História 2 — Comparar orçamento e passeios confirmados (Prioridade: P1)

Todos os participantes consultam, no resumo de custos, o orçamento, o total estimado dos passeios confirmados e a situação do limite, sempre por pessoa.

**Justificativa da prioridade**: Permite avaliar o custo do roteiro sem transformar o orçamento em uma restrição às decisões do grupo.

**Teste independente**: Consultar viagens com orçamento ausente, zero e R$ 500,00, variando os custos e os estados dos passeios.

**Cenários de aceite**:

1. **Dado** um orçamento de R$ 500,00 e total confirmado de R$ 320,00, **quando** qualquer participante consulta o resumo, **então** visualiza R$ 500,00 de orçamento, R$ 320,00 de total e R$ 180,00 restantes.
2. **Dado** um orçamento de R$ 500,00 e total confirmado de R$ 550,00, **quando** o resumo é exibido, **então** apresenta aviso textual com R$ 50,00 excedidos.
3. **Dado** um orçamento de R$ 500,00 e total confirmado de R$ 500,00, **quando** o resumo é exibido, **então** informa que o limite foi atingido, sem indicar valor positivo restante ou excedido.
4. **Dada** uma viagem sem orçamento, nova ou existente, **quando** o resumo é exibido, **então** mantém o total confirmado, informa que o orçamento ainda não foi definido e não apresenta saldo, excesso ou limite atingido; apenas o organizador recebe a ação de definição.
5. **Dado** um orçamento zero, **quando** o total confirmado é zero, **então** o limite é informado como atingido; se o total passa a R$ 20,00, são informados R$ 20,00 excedidos.
6. **Dada** uma viagem sem passeios confirmados e com orçamento de R$ 500,00, **quando** o resumo é exibido, **então** o total é R$ 0,00 e restam R$ 500,00, independentemente dos custos dos passeios em votação.
7. **Dado** um roteiro com orçamento definido, **quando** passeios em votação são sugeridos, alterados ou recebem votos, **então** essas ações não alteram o total nem a comparação.
8. **Dado** um roteiro com orçamento definido, **quando** um passeio é confirmado, removido ou reaberto para votação, **então** o total e a comparação acompanham a inclusão ou retirada de seu custo na atualização existente do roteiro.
9. **Dado** um passeio confirmado, **quando** uma edição efetiva o devolve à votação conforme a regra existente, **então** seu custo deixa o total e a comparação; sua confirmação posterior inclui o custo atualizado.
10. **Dado** um orçamento excedido, **quando** são realizadas ações de sugerir, votar ou confirmar passeios por pessoas com a permissão correspondente, **então** o excesso não bloqueia essas ações nem altera suas regras.
11. **Dado** o mesmo orçamento e os mesmos passeios confirmados, **quando** muda a quantidade de participantes, **então** os valores por pessoa permanecem iguais.
12. **Dada** uma mudança bem-sucedida no orçamento ou nos passeios, **quando** os dados atualizados são recebidos na página que realizou a ação ou na próxima atualização periódica das demais páginas abertas, **então** o resumo apresenta valores coerentes com esses dados.

### História 3 — Preencher e corrigir o orçamento com segurança (Prioridade: P2)

O organizador utiliza o modal nos dispositivos suportados, recebe validação e feedback e pode cancelar ou repetir uma tentativa malsucedida.

**Justificativa da prioridade**: Evita perda de preenchimento e permite concluir o fluxo com acessibilidade e recuperação de erros.

**Teste independente**: Exercitar o modal em desktop, celular e somente por teclado, usando entradas válidas, inválidas e uma falha de salvamento.

**Cenários de aceite**:

1. **Dado** o modal de definição ou edição, **quando** são informados valores negativos, não numéricos, vazios ou com mais de duas casas decimais, **então** o salvamento é recusado com mensagem associada ao campo, sem alterar o valor persistido.
2. **Dado** o modal, **quando** são informados zero, um valor inteiro ou um valor com uma ou duas casas decimais, **então** o valor é aceito e exibido como quantia em reais com duas casas decimais.
3. **Dado** um preenchimento ainda não salvo, **quando** o organizador cancela ou fecha o modal antes de enviar, **então** o orçamento persistido permanece inalterado.
4. **Dado** um envio em andamento, **quando** o organizador acompanha o modal, **então** o estado de envio é perceptível e novos envios simultâneos pelo mesmo formulário ficam impedidos.
5. **Dado** um erro ao salvar, **quando** a falha é informada, **então** o modal permanece aberto com o valor preenchido, o resumo mantém o último valor confirmado e uma nova tentativa é permitida.
6. **Dado** um erro ao remover o orçamento, **quando** a falha é informada, **então** o último orçamento confirmado permanece exibido e é possível tentar a remoção novamente.
7. **Dado** acesso por desktop, celular ou somente teclado, **quando** são executados os fluxos de definição, edição, cancelamento e remoção, **então** os campos e as ações permanecem acessíveis, o foco fica no modal enquanto aberto e retorna ao acionador ou a um controle equivalente ao fechar.
8. **Dado** o resumo ou o modal, **quando** seus textos, avisos e controles são consultados, **então** identificam estimativas em reais por pessoa referentes apenas a passeios; mensagens de validação, envio e erro são acessíveis e não dependem apenas de cor.

### Casos de borda

- Ausência de orçamento é distinta de R$ 0,00; remover o orçamento não equivale a salvar zero.
- Campo vazio não define nem remove orçamento implicitamente; a remoção depende da ação explícita e de confirmação.
- Orçamento zero com total zero informa limite atingido e representa planejamento apenas de passeios gratuitos; incluir passeio pago gera aviso, sem bloqueio.
- Sem passeios confirmados, o total é R$ 0,00, inclusive quando existem sugestões pagas em votação.
- Orçamento de R$ 0,30 e passeios confirmados de R$ 0,10 e R$ 0,20 resultam em limite atingido, sem restante ou excesso residual.
- Remover o último passeio confirmado retorna o total a zero e recalcula a comparação, quando houver orçamento.
- Uma edição de passeio sem alteração efetiva mantém sua confirmação e seus efeitos no total, conforme a regra existente.
- Falhas de validação, salvamento ou autorização não devem apresentar a mudança como concluída nem substituir o último valor confirmado.

## Requisitos

### Requisitos funcionais

- **FR-001**: Cada viagem DEVE admitir um único orçamento estimado opcional por pessoa, compartilhado como referência para todos os seus participantes.
- **FR-002**: Somente o organizador DEVE poder definir, editar e remover o orçamento nos detalhes da viagem. Os demais participantes DEVEM poder consultá-lo.
- **FR-003**: As permissões DEVEM ser verificadas independentemente da interface, inclusive em acesso direto à API e aos dados. Pessoas sem acesso à viagem NÃO DEVEM consultar ou alterar o orçamento.
- **FR-004**: O orçamento DEVE aceitar valores numéricos em reais, maiores ou iguais a zero, com até duas casas decimais. Valores negativos, não numéricos, vazios ou com precisão superior DEVEM ser recusados, sem arredondamento silencioso da entrada.
- **FR-005**: Definição, edição e remoção bem-sucedidas DEVEM persistir após recarregar a página. Cada operação DEVE afetar apenas o orçamento da viagem selecionada.
- **FR-006**: Viagens novas e existentes DEVEM permanecer sem orçamento até definição explícita pelo organizador. Ausência NÃO DEVE ser convertida em zero.
- **FR-007**: Sem orçamento, o resumo DEVE manter o total estimado confirmado, informar que o orçamento ainda não foi definido e oferecer a definição apenas ao organizador, sem apresentar saldo, excesso ou limite atingido.
- **FR-008**: O total estimado DEVE somar apenas os custos por pessoa dos passeios confirmados; passeios em votação DEVEM ser desconsiderados e a ausência de confirmados DEVE resultar em zero.
- **FR-009**: Com orçamento, todos os participantes DEVEM visualizar orçamento e total confirmado por pessoa. Se o total for menor, DEVE ser apresentado o restante, igual ao orçamento menos o total; se for maior, DEVE ser apresentado aviso com o excesso, igual ao total menos o orçamento; se forem iguais, DEVE ser informado que o limite foi atingido.
- **FR-010**: Valores monetários DEVEM ser apresentados em reais com duas casas decimais, e a comparação DEVE respeitar a exatidão dos centavos, sem diferenças residuais.
- **FR-011**: Nenhum valor do resumo DEVE ser multiplicado ou dividido pela quantidade de participantes.
- **FR-012**: Exceder o orçamento NÃO DEVE impedir sugerir, votar ou confirmar passeios, nem alterar permissões ou regras dessas ações.
- **FR-013**: Alterações bem-sucedidas no orçamento ou no roteiro DEVEM atualizar a comparação junto aos dados recebidos pelo mecanismo existente, incluindo a atualização após ações locais e a consulta periódica a cada 30 segundos nas páginas abertas. Não se exige sincronização em tempo real.
- **FR-014**: A comparação DEVE acompanhar confirmação, reabertura, remoção e edição de passeios conforme seu estado atual. Uma edição efetiva que reabra um passeio DEVE retirar seu custo do total até nova confirmação.
- **FR-015**: O orçamento e sua comparação DEVEM integrar o resumo de custos dos detalhes da viagem e identificar claramente estimativas por pessoa referentes somente a passeios.
- **FR-016**: Definição e edição DEVEM utilizar modal conforme os padrões existentes, com campo inicialmente vazio na definição e preenchido com o valor salvo na edição. Cancelar ou fechar antes de enviar DEVE descartar alterações não salvas.
- **FR-017**: O modal DEVE apresentar validação associada ao campo, estado de envio e erros acessíveis, impedir envios simultâneos pelo formulário e fechar com indicação de sucesso somente após confirmação do salvamento.
- **FR-018**: Em falha de salvamento, o modal DEVE preservar o valor preenchido e permitir correção ou nova tentativa. Falhas ao salvar ou remover DEVEM manter o último valor confirmado no resumo, sem comunicar sucesso.
- **FR-019**: A remoção DEVE exigir confirmação, permitir cancelamento e restabelecer o estado sem orçamento, preservando passeios, custos e votos.
- **FR-020**: Resumo, modal e confirmação de remoção DEVEM funcionar em desktop e celular, sem ocultar valores ou ações, e permitir operação integral por teclado, com nomes acessíveis, foco visível e contido no modal, retorno de foco ao fechar e avisos que não dependam apenas de cor.

### Entidades principais

- **Viagem**: Reúne organizador, participantes, passeios e um orçamento opcional em reais por pessoa. Ausência e valor zero são estados distintos.
- **Passeio**: Possui custo estimado por pessoa e situação de votação ou confirmação; somente a confirmação o inclui no total.
- **Resumo de custos**: Apresenta o orçamento opcional, a soma dos custos confirmados e, quando aplicável, restante, limite atingido ou excesso. A comparação é derivada dos valores atuais.
- **Participação**: Define o acesso à viagem e distingue o organizador, que gerencia o orçamento, dos demais participantes, que o consultam.

### Fora do escopo

- Orçamentos individuais diferentes para cada participante.
- Hospedagem, alimentação, transporte e aluguel de veículos.
- Despesas reais, pagamentos, rateio e acerto de contas.
- Conversão de moedas.
- Cotações externas, IA e notificações.
- Mudanças nas regras de votação, confirmação e edição de passeios.

## Critérios de sucesso

### Resultados mensuráveis

- **SC-001**: As três operações de gestão — definir, editar e remover — podem ser concluídas pelo organizador, com resultado preservado após recarregar, em todos os cenários de aceite correspondentes.
- **SC-002**: Todas as tentativas de alteração por participantes comuns são recusadas, incluindo tentativas fora da interface; os participantes autorizados à consulta visualizam a mesma referência de orçamento.
- **SC-003**: Os três exemplos com orçamento de R$ 500,00 produzem exatamente R$ 180,00 restantes para total de R$ 320,00, R$ 50,00 excedidos para total de R$ 550,00 e limite atingido para total de R$ 500,00; os casos de zero e centavos também produzem os resultados especificados.
- **SC-004**: Em todas as viagens sem orçamento dos cenários de aceite, o custo confirmado permanece visível e nenhuma indicação de saldo, excesso ou limite atingido aparece.
- **SC-005**: Alterações na quantidade de participantes e em passeios que permanecem em votação produzem variação de R$ 0,00 nos valores do resumo.
- **SC-006**: Mudanças de orçamento e de passeios confirmados aparecem na comparação junto à próxima atualização bem-sucedida dos dados da viagem, sem recarga manual adicional.
- **SC-007**: Os fluxos de definição, edição, cancelamento e remoção podem ser concluídos em desktop, celular e somente por teclado, sem perda de acesso a campos, mensagens ou ações.
- **SC-008**: Nos cenários de falha de salvamento, o preenchimento é integralmente preservado e uma nova tentativa pode ser concluída sem redigitar o valor. Remover o orçamento produz zero alterações nos passeios, custos e votos.
- **SC-009**: Sugerir, votar e confirmar continuam disponíveis conforme as permissões existentes nos cenários com orçamento excedido.

## Premissas e dependências

- Organizador e participantes seguem as definições e as permissões atuais da viagem; não são criados novos papéis.
- A soma dos passeios confirmados e a atualização periódica de 30 segundos já existem, conforme o comportamento consultado e a seção de roteiro de [MVP](../../docs/mvp.md). O prazo da atualização depende do recebimento bem-sucedido dos dados, sem nova promessa de sincronização.
- A edição efetiva reabre passeios confirmados, conforme a [spec 001](../../docs/specs/001-edicao-de-passeios.md); o orçamento acompanha essa regra. A descrição histórica de remoção e recadastro no MVP foi corrigida durante a implementação da spec 004.
- O modal segue os padrões da [spec 002](../../docs/specs/002-navegacao-e-modais-de-passeios.md). A confirmação da remoção decorre da constituição do projeto.
- Campo vazio é considerado preenchimento incompleto ao definir ou editar; a ausência de orçamento é obtida pela remoção explícita. Essa distinção evita apagar um valor salvo por engano.
- Não é estabelecido um teto de negócio adicional para o orçamento nesta especificação; o limite do custo de um passeio não é presumido como limite do orçamento da viagem.
- A revisão de qualidade desta especificação não substitui a validação de escopo por Gabriel. As regras propostas passam a integrar o MVP quando implementadas; esta etapa registra apenas a proposta.
