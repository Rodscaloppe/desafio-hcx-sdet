import { CartModalComponent } from './cart-modal.component';

/**
 * Página de detalhe do produto (/product_details/:id).
 *
 * O botão de adicionar ao carrinho não possui data-qa nem id; o seletor
 * por tipo+classe (button.cart) é o mais estável disponível e está
 * encapsulado aqui — ponto único de manutenção (fragilidade documentada).
 */
export interface ProductDetailInfo {
  name: string;
  price: string;
}

export class ProductDetailPage {
  private readonly name = '.product-information h2';
  private readonly price = '.product-information span > span';
  private readonly quantityInput = '#quantity';
  private readonly addToCartButton = 'button.cart';
  private readonly cartModal = new CartModalComponent();

  visit(productId: string): void {
    cy.visit(`/product_details/${productId}`);
    cy.get(this.name).should('be.visible');
  }

  getInfo(): Cypress.Chainable<ProductDetailInfo> {
    return cy.get(this.name).then(($name) =>
      cy
        .get(this.price)
        .first()
        .then(($price) => ({
          name: $name.text().trim(),
          price: $price.text().trim(),
        })),
    );
  }

  setQuantity(quantity: number): void {
    cy.get(this.quantityInput).clear();
    cy.get(this.quantityInput).type(String(quantity));
  }

  addToCart(): void {
    cy.get(this.addToCartButton).click();
    this.cartModal.assertVisible();
  }
}
