@web @regression @WEB-04
Feature: Checkout (WEB-04)
  Como usuário autenticado
  Quero revisar meu pedido e concluir a compra
  Para receber os produtos no endereço correto

  Critérios de aceite cobertos:
  - Usuário autenticado preenche dados obrigatórios, revisa o pedido e
    conclui o fluxo quando o ambiente permite (WEB04-CT01)

  Limite declarado do ambiente: o pagamento é um formulário SIMULADO, sem
  gateway real. Utilizamos dados de pagamento fictícios (PAN de teste) e
  validamos apenas o comportamento observável do ambiente.

  @WEB04-CT01 @provisioned-user @authenticated
  Scenario: WEB04-CT01 - Usuário autenticado revisa e conclui o pedido
    Given que o usuário autenticado possui um produto no carrinho
    When ele avança para a revisão do pedido
    Then o endereço de entrega deve corresponder aos dados da conta
    And o pedido deve listar o produto adicionado
    When ele confirma o pedido
    And informa os dados de pagamento válidos
    And submete o pagamento
    Then o sistema deve confirmar a conclusão do pedido
