/**
 * Modal de confirmação exibido após adicionar produto ao carrinho.
 * Componente compartilhado entre listagem e detalhe do produto.
 */
export class CartModalComponent {
  private readonly modal = '#cartModal';

  assertVisible(): void {
    cy.get(this.modal).should('be.visible');
  }

  continueShopping(): void {
    cy.get(this.modal).contains('button', 'Continue Shopping').click();
    cy.get(this.modal).should('not.be.visible');
  }

  goToCart(): void {
    cy.get(this.modal).contains('a', 'View Cart').click();
    cy.location('pathname').should('eq', '/view_cart');
  }
}
