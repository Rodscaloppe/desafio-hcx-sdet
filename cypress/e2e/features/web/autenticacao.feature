@web @regression @WEB-01
Feature: Autenticação de usuários (WEB-01)
  Como visitante da loja
  Quero acessar minha conta com minhas credenciais
  Para comprar com segurança e encerrar minha sessão quando quiser

  Critérios de aceite cobertos:
  - Credenciais válidas permitem acesso (WEB01-CT01)
  - Credenciais inválidas não autenticam e exibem mensagem verificável (WEB01-CT02)
  - Sessão e logout são tratados (WEB01-CT03)

  @smoke @WEB01-CT01 @provisioned-user
  Scenario: WEB01-CT01 - Usuário cadastrado acessa a conta com credenciais válidas
    Given que existe um usuário cadastrado
    When ele acessa a conta com suas credenciais válidas
    Then o sistema deve autenticar o usuário
    And deve exibir a identificação do usuário conectado

  @WEB01-CT02 @provisioned-user
  Scenario: WEB01-CT02 - Usuário não autenticado informa senha inválida
    Given que existe um usuário cadastrado
    When ele informa uma senha inválida
    And solicita o acesso
    Then o sistema deve rejeitar a autenticação
    And deve informar que as credenciais são inválidas
    And não deve criar uma sessão autenticada

  @WEB01-CT03 @provisioned-user @authenticated
  Scenario: WEB01-CT03 - Usuário autenticado encerra a sessão
    Given que o usuário está autenticado
    When ele solicita o encerramento da sessão
    Then o sistema deve encerrar a sessão
    And deve oferecer novamente a opção de acesso
