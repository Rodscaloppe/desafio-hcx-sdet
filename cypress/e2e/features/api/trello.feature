@api @regression @API-01
Feature: Consulta de lista na API do Trello (API-01)
  Como consumidor da API do Trello
  Quero consultar os dados de uma lista
  Para exibir seu nome e estado em integrações

  Critérios de aceite cobertos:
  - Endpoint, contrato, status esperado e autenticação configuráveis
  - Recusa sem credenciais, sem exposição de dados (API01-CT01) e recusa
    por autenticação inválida (API01-CT02) — executáveis sem segredos
  - Sucesso autenticado: estrutura confirmada ANTES de validar o campo
    list.name, com resposta sanitizada registrada (API01-CT03)

  Expectativas de status DECLARADAS (contrato observado da API Trello):
  - Sem credenciais e identificador malformado: 400 (recusada, sem dados)
  - Credenciais inválidas: 401 "invalid key"
  - Credenciais válidas e lista existente: 200 + contrato da lista
  Justificativa: sem credenciais o Trello responde 400 para id malformado
  ou 404 para id inexistente — nunca 200 com dados; a recusa de
  AUTENTICAÇÃO (401) é exercitada de forma determinística no cenário de
  credenciais inválidas.

  Modo de execução controlado: API01-CT03 exige TRELLO_API_KEY,
  TRELLO_API_TOKEN e TRELLO_LIST_ID no ambiente (tag @trello-auth).
  Sem configuração, o cenário falha explicitamente classificado como
  BLOQUEIO DE AMBIENTE — nunca é mascarado nem executado por padrão.

  @smoke @API01-CT01
  Scenario: API01-CT01 - Consulta sem credenciais é recusada sem expor dados
    When uma lista é consultada sem credenciais
    Then a API do Trello deve recusar a requisição
    And a resposta não deve expor dados de lista

  @API01-CT02
  Scenario: API01-CT02 - Consulta com credenciais inválidas é recusada como não autorizada
    When uma lista é consultada com credenciais inválidas
    Then a API do Trello deve recusar a requisição como não autorizada

  @trello-auth @API01-CT03
  Scenario: API01-CT03 - Consulta autenticada retorna a lista com nome válido
    Given que a integração Trello está configurada no ambiente
    When a lista configurada é consultada com credenciais válidas
    Then a API do Trello deve confirmar o sucesso da consulta
    And a estrutura da lista deve seguir o contrato documentado
    And o campo name da lista deve ser um texto não vazio
    And a resposta sanitizada deve ser registrada como evidência
