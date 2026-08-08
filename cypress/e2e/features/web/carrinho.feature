@web @regression @WEB-03
Feature: Carrinho de compras (WEB-03)
  Como visitante da loja
  Quero adicionar produtos ao carrinho
  Para revisar itens, quantidades e valores antes de comprar

  Critérios de aceite cobertos:
  - Produto, preço, quantidade e subtotal consistentes entre listagem,
    detalhe e carrinho (WEB03-CT01, WEB03-CT02)
  - Inclusão duplicada possui comportamento documentado (WEB03-CT03)

  @smoke @WEB03-CT01
  Scenario: WEB03-CT01 - Produto adicionado na listagem é exibido com consistência no carrinho
    Given que o visitante está no catálogo de produtos
    When ele adiciona o primeiro produto da listagem ao carrinho
    And acessa o carrinho
    Then o carrinho deve exibir o mesmo produto e preço da listagem
    And a quantidade deve ser uma unidade
    And o subtotal deve ser consistente com preço e quantidade

  @WEB03-CT02
  Scenario: WEB03-CT02 - Quantidade definida no detalhe reflete no subtotal do carrinho
    Given que o visitante está no detalhe de um produto
    When ele define a quantidade desejada para 3 unidades
    And adiciona o produto ao carrinho
    And acessa o carrinho
    Then o carrinho deve exibir o mesmo produto e preço do detalhe
    And a quantidade deve ser 3 unidades
    And o subtotal deve ser consistente com preço e quantidade

  @WEB03-CT03
  Scenario: WEB03-CT03 - Inclusão duplicada do mesmo produto soma a quantidade em um único item
    # Comportamento OBSERVADO e documentado do ambiente: adicionar o mesmo
    # produto duas vezes NÃO cria linha duplicada; a quantidade do item é
    # somada (1 -> 2) e o subtotal acompanha. Se o produto mudar essa regra,
    # este cenário deve ser revisto.
    Given que o visitante está no catálogo de produtos
    When ele adiciona o primeiro produto da listagem ao carrinho
    And continua comprando
    And adiciona o mesmo produto ao carrinho novamente
    And acessa o carrinho
    Then o carrinho deve exibir uma única linha para o produto
    And a quantidade deve ser 2 unidades
    And o subtotal deve ser consistente com preço e quantidade
