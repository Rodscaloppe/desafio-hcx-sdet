@web @regression @WEB-05
Feature: Validação de campos obrigatórios (WEB-05)
  Como usuário da loja
  Quero ser impedido de avançar com dados obrigatórios ausentes
  Para não concluir operações inválidas

  Critérios de aceite cobertos:
  - Campos obrigatórios bloqueiam o avanço com mensagem associada ao campo,
    sem depender apenas de cor (WEB05-CT01, WEB05-CT02, WEB05-CT03)
  - Regra de negócio de unicidade de e-mail no cadastro (WEB05-CT01)

  @WEB05-CT01 @provisioned-user
  Scenario: WEB05-CT01 - Cadastro com e-mail já existente é rejeitado
    Given que existe um usuário cadastrado
    When outro visitante tenta se cadastrar com o mesmo e-mail
    Then o sistema deve rejeitar o cadastro
    And deve informar que o e-mail já está cadastrado

  @WEB05-CT02
  Scenario: WEB05-CT02 - Login sem preencher campos obrigatórios é bloqueado
    Given que o visitante está na página de acesso
    When ele solicita o acesso sem informar e-mail e senha
    Then o avanço deve ser bloqueado na página de acesso
    And o campo de e-mail deve sinalizar a obrigatoriedade com mensagem associada

  @WEB05-CT03 @provisioned-user @authenticated
  Scenario: WEB05-CT03 - Pagamento sem o nome no cartão é bloqueado
    Given que o usuário autenticado possui um produto no carrinho
    And ele avançou até o pagamento
    When ele submete o pagamento sem informar o nome no cartão
    Then o avanço deve ser bloqueado na página de pagamento
    And o campo de nome do cartão deve sinalizar a obrigatoriedade com mensagem associada
