@web @regression @WEB-02
Feature: Busca de produtos (WEB-02)
  Como visitante da loja
  Quero buscar produtos por nome
  Para encontrar rapidamente o que desejo comprar

  Critérios de aceite cobertos:
  - Resultado correspondente é exibido (WEB02-CT01)
  - Busca sem correspondência comunica o estado (WEB02-CT02)
  - Entrada vazia é avaliada (WEB02-CT03)
  - Normalização de espaços é avaliada (WEB02-CT04, defeito conhecido)

  @smoke @WEB02-CT01
  Scenario: WEB02-CT01 - Busca por termo existente exibe produtos correspondentes
    Given que o visitante está no catálogo de produtos
    When ele busca por um termo com correspondência
    Then o sistema deve exibir a seção de resultados da busca
    And devem ser exibidos produtos correspondentes ao termo buscado

  @WEB02-CT02
  Scenario: WEB02-CT02 - Busca sem correspondência comunica o estado vazio
    Given que o visitante está no catálogo de produtos
    When ele busca por um termo sem correspondência
    Then o sistema deve exibir a seção de resultados da busca
    And não deve listar nenhum produto

  @fronteira @WEB02-CT03
  Scenario: WEB02-CT03 - Busca com entrada vazia mantém o catálogo completo
    # Comportamento OBSERVADO e documentado: acionar a busca com o campo
    # vazio não navega nem altera a listagem — o catálogo completo
    # ("All Products") permanece exibido.
    Given que o visitante está no catálogo de produtos
    When ele aciona a busca sem informar um termo
    Then deve manter a exibição do catálogo completo

  @fronteira @known-issue @WEB02-CT04
  Scenario: WEB02-CT04 - Busca com espaços nas extremidades deve normalizar o termo
    # DEFEITO CONHECIDO (classificado como falha de produto): a busca não
    # normaliza espaços nas extremidades — "  dress  " retorna 0 resultados
    # enquanto "dress" retorna 9. Este cenário documenta o comportamento
    # ESPERADO de negócio e executa em suíte separada (não bloqueante),
    # com a falha registrada e classificada no relatório de triagem.
    Given que o visitante está no catálogo de produtos
    When ele busca por um termo com correspondência cercado de espaços
    Then o sistema deve exibir a seção de resultados da busca
    And devem ser exibidos produtos correspondentes ao termo buscado
