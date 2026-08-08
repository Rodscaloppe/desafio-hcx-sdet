import { CartModalComponent } from './cart-modal.component';

/**
 * Página de catálogo (/products) e resultados de busca.
 *
 * Nota de testabilidade: o campo de busca possui id estável
 * (#search_product), mas não existe data-qa. O botão de busca usa o id
 * #submit_search. Ambos documentados como seletores aceitáveis (id).
 */
export interface ProductCardInfo {
  productId: string;
  name: string;
  price: string;
}

export class ProductsPage {
  private readonly searchInput = '#search_product';
  private readonly searchButton = '#submit_search';
  private readonly resultTitle = 'h2.title';
  private readonly cards = '.productinfo';
  private readonly cartModal = new CartModalComponent();

  visit(): void {
    cy.visit('/products');
    cy.contains(this.resultTitle, 'All Products').should('be.visible');
  }

  search(term: string): void {
    cy.get(this.searchInput).clear();
    if (term.length > 0) {
      cy.get(this.searchInput).type(term);
    }
    cy.get(this.searchButton).click();
  }

  /** Título "Searched Products" confirma que a busca foi processada. */
  assertSearchExecuted(): void {
    cy.contains(this.resultTitle, 'Searched Products').should('be.visible');
  }

  resultCards(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.cards);
  }

  catalogSize(): Cypress.Chainable<number> {
    return cy.get(this.cards).its('length');
  }

  /** Captura id, nome e preço do primeiro card para checagem posterior. */
  firstCardInfo(): Cypress.Chainable<ProductCardInfo> {
    return cy
      .get(this.cards)
      .first()
      .then(($card) => ({
        productId: String($card.find('a.add-to-cart').attr('data-product-id')),
        name: $card.find('p').first().text().trim(),
        price: $card.find('h2').first().text().trim(),
      }));
  }

  addFirstProductToCart(): void {
    cy.get(this.cards).first().within(() => {
      cy.get('a.add-to-cart').first().click();
    });
    // Sincronização por estado: o modal de confirmação é o resultado
    // observável da inclusão.
    this.cartModal.assertVisible();
  }
}
