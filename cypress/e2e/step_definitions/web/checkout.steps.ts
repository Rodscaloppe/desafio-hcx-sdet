import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { context } from '../../../support/context';
import { HeaderComponent } from '../../../support/page_objects/header.component';
import { CartPage } from '../../../support/page_objects/cart.page';
import { CheckoutPage } from '../../../support/page_objects/checkout.page';
import { PaymentPage } from '../../../support/page_objects/payment.page';
import { buildPaymentData } from '../../../support/factories/payment.factory';

const header = new HeaderComponent();
const cartPage = new CartPage();
const checkoutPage = new CheckoutPage();
const paymentPage = new PaymentPage();

// WEB04-CT01 - revisão e conclusão do pedido

When('ele avança para a revisão do pedido', () => {
  header.goToCart();
  cartPage.proceedToCheckout();
});

Then('o endereço de entrega deve corresponder aos dados da conta', () => {
  checkoutPage.assertOnCheckoutPage();
  const user = context.currentUser!;
  checkoutPage.assertDeliveryAddressContains(
    user.firstName,
    user.lastName,
    user.address1,
    user.city,
    user.country,
    user.mobileNumber,
  );
});

Then('o pedido deve listar o produto adicionado', () => {
  const { productId, name } = context.cartExpectation!;
  checkoutPage.assertOrderContainsItem(productId, name);
});

When('ele confirma o pedido', () => {
  checkoutPage.placeOrder();
});

When('informa os dados de pagamento válidos', () => {
  // Dados fictícios (PAN de teste) — ver factories/payment.factory.ts.
  paymentPage.fill(buildPaymentData());
});

When('submete o pagamento', () => {
  paymentPage.submit();
});

Then('o sistema deve confirmar a conclusão do pedido', () => {
  paymentPage.assertOrderConfirmed();
});
