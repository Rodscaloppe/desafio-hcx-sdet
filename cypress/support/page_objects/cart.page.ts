/**
 * Página do carrinho (/view_cart).
 * Linhas identificadas por id de produto (#product-<id>) — atributo estável.
 */
export class CartPage {
  private readonly table = '#cart_info_table';

  visit(): void {
    cy.visit('/view_cart');
    cy.get(this.table).should('be.visible');
  }

  private row(productId: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(`${this.table} tr#product-${productId}`);
  }

  /** Produto e preço exibidos no carrinho iguais aos da listagem/detalhe. */
  assertItemIdentityMatches(
    productId: string,
    name: string,
    price: string,
  ): void {
    this.row(productId).within(() => {
      cy.get('.cart_description h4 a').should('have.text', name);
      cy.get('.cart_price p').should('have.text', price);
    });
  }

  assertItemQuantity(productId: string, quantity: number): void {
    this.row(productId)
      .find('.cart_quantity button')
      .should('have.text', String(quantity));
  }

  /** Invariante de negócio: subtotal = preço unitário × quantidade. */
  assertItemSubtotalConsistent(
    productId: string,
    unitPrice: string,
    quantity: number,
  ): void {
    this.row(productId)
      .find('.cart_total_price')
      .then(($total) => {
        const unit = Number(unitPrice.replace(/\D/g, ''));
        const total = Number($total.text().replace(/\D/g, ''));
        expect(total, `subtotal = ${unitPrice} x ${quantity}`).to.eq(
          unit * quantity,
        );
      });
  }

  assertSingleRowFor(productId: string): void {
    cy.get(`${this.table} tr#product-${productId}`).should('have.length', 1);
  }

  proceedToCheckout(): void {
    cy.contains('.btn', 'Proceed To Checkout').click();
  }
}
