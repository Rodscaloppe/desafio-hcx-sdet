/**
 * Fábrica de dados de pagamento FICTÍCIOS.
 *
 * O cartão 4111 1111 1111 1111 é o PAN de teste público e amplamente
 * documentado para gateways simulados (não é um dado financeiro real).
 * O Automation Exercise não possui gateway real: o formulário apenas
 * valida presença/formato dos campos (limite declarado do ambiente).
 */
export interface PaymentData {
  nameOnCard: string;
  cardNumber: string;
  cvc: string;
  expiryMonth: string;
  expiryYear: string;
}

export function buildPaymentData(
  overrides: Partial<PaymentData> = {},
): PaymentData {
  return {
    nameOnCard: 'QA HCX TESTE',
    cardNumber: '4111111111111111',
    cvc: '123',
    expiryMonth: '12',
    expiryYear: '2030',
    ...overrides,
  };
}
