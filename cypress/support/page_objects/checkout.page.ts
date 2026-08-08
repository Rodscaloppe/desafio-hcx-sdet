/**
 * Página de revisão do pedido (/checkout): endereços e itens antes do
 * pagamento. O botão "Place Order" é identificado pelo href estável.
 */
export class CheckoutPage {
  private readonly deliveryAddress = '#address_delivery';
  // Revisão do pedido no checkout usa a div #cart_info (diferente da
  // tabela #cart_info_table da página de carrinho) — fragilidade
  // encapsulada neste page object.
  private readonly orderTable = '#cart_info table';
  private readonly commentInput = 'textarea[name="message"]';
  private readonly placeOrderButton = 'a[href="/payment"]';

  assertOnCheckoutPage(): void {
    cy.location('pathname').should('eq', '/checkout');
    cy.get(this.deliveryAddress).should('be.visible');
  }

  assertDeliveryAddressContains(...fragments: string[]): void {
    cy.get(this.deliveryAddress).then(($address) => {
      const text = $address.text();
      fragments.forEach((fragment) => {
        expect(text, `endereço de entrega contém "${fragment}"`).to.include(
          fragment,
        );
      });
    });
  }

  assertOrderContainsItem(productId: string, name: string): void {
    cy.get(`${this.orderTable} tr#product-${productId}`)
      .should('exist')
      .within(() => {
        cy.get('.cart_description h4 a').should('have.text', name);
      });
  }

  addComment(comment: string): void {
    cy.get(this.commentInput).type(comment);
  }

  placeOrder(): void {
    cy.get(this.placeOrderButton).click();
    cy.location('pathname').should('eq', '/payment');
  }
}
