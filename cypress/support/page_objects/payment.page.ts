import type { PaymentData } from '../factories/payment.factory';

/**
 * Página de pagamento (/payment) — formulário SIMULADO, sem gateway real
 * (limite declarado do ambiente; validamos apenas o comportamento
 * observável: validação de campos e confirmação do pedido).
 */
export class PaymentPage {
  private readonly nameOnCard = '[data-qa="name-on-card"]';
  private readonly cardNumber = '[data-qa="card-number"]';
  private readonly cvc = '[data-qa="cvc"]';
  private readonly expiryMonth = '[data-qa="expiry-month"]';
  private readonly expiryYear = '[data-qa="expiry-year"]';
  private readonly payButton = '[data-qa="pay-button"]';
  private readonly orderPlacedMessage = '[data-qa="order-placed"]';

  /** Preenche apenas os campos com valor (vazio = campo não preenchido). */
  fill(data: PaymentData): void {
    const fields: Array<[string, string]> = [
      [this.nameOnCard, data.nameOnCard],
      [this.cardNumber, data.cardNumber],
      [this.cvc, data.cvc],
      [this.expiryMonth, data.expiryMonth],
      [this.expiryYear, data.expiryYear],
    ];
    fields.forEach(([selector, value]) => {
      if (value.length > 0) {
        cy.get(selector).type(value);
      }
    });
  }

  submit(): void {
    cy.get(this.payButton).click();
  }

  /**
   * Confirmação de negócio do pedido (não apenas existência da página):
   * título "Order Placed!" + mensagem de confirmação.
   */
  assertOrderConfirmed(): void {
    cy.get(this.orderPlacedMessage).should('be.visible');
    cy.contains(
      'Congratulations! Your order has been confirmed!',
    ).should('be.visible');
  }

  /** Pós-condição de avanço bloqueado: permanecemos na página de pagamento. */
  assertBlockedOnPaymentPage(): void {
    cy.location('pathname').should('eq', '/payment');
  }

  /**
   * Validação de campo obrigatório via API de validade do HTML5: o avanço
   * é bloqueado e a mensagem pertence ao campo (independe de cor).
   */
  assertNameOnCardRequiredViolation(): void {
    cy.get(this.nameOnCard).then(($input) => {
      const input = $input.get(0) as HTMLInputElement;
      expect(input.validity.valueMissing, 'campo obrigatório sinalizado').to.eq(
        true,
      );
      expect(input.validationMessage, 'mensagem associada ao campo').to.not.eq(
        '',
      );
    });
  }
}
