@api @regression @API-02
Feature: Criação de conta via API do Automation Exercise (API-02)
  Como integrador da loja
  Quero criar contas pela API
  Para automatizar cadastros com dados únicos e rastreáveis

  Critérios de aceite cobertos:
  - Sucesso com dados únicos: status, contrato e regra de negócio (API02-CT01)
  - Parâmetros ausentes: regra de negócio de erro por parâmetro (API02-CT02)
  - Parâmetro inválido (e-mail duplicado): regra de negócio (API02-CT03)
  - Estratégia de limpeza/idempotência: conta criada é removida no teardown

  Expectativa de status DECLARADA (quirk observado do contrato): a API
  responde HTTP 200 em todos os casos; o resultado de negócio é expresso
  pelo campo responseCode no corpo (201 criado, 400 erro de validação).

  @smoke @API02-CT01
  Scenario: API02-CT01 - Criar conta com dados únicos confirma a criação
    Given que foi gerada uma conta de teste com dados únicos
    When a criação da conta é solicitada à API
    Then a API deve responder com sucesso
    And o corpo deve seguir o contrato padrão da API
    And a regra de negócio deve confirmar a conta criada
    And a conta criada deve ser removida no encerramento do cenário

  @API02-CT02
  Scenario Outline: API02-CT02 - Criar conta sem o parâmetro "<parametro>" é rejeitada
    Given que foi gerada uma conta de teste sem o parâmetro "<parametro>"
    When a criação da conta é solicitada à API
    Then a API deve responder com sucesso
    And o corpo deve seguir o contrato padrão da API
    And a regra de negócio deve rejeitar a requisição por parâmetro ausente "<parametro>"

    Examples:
      | parametro |
      | email     |
      | name      |
      | password  |

  @API02-CT03
  Scenario: API02-CT03 - Criar conta com e-mail já existente é rejeitada
    Given que foi gerada uma conta de teste com dados únicos
    And a conta já existe na loja
    When a criação da conta é solicitada à API
    Then a API deve responder com sucesso
    And o corpo deve seguir o contrato padrão da API
    And a regra de negócio deve rejeitar a requisição por e-mail duplicado
    And a conta criada deve ser removida no encerramento do cenário
