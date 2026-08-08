import {
  Given,
  When,
  Then,
} from '@badeball/cypress-cucumber-preprocessor';
import { context } from '../../../support/context';
import { LoginPage } from '../../../support/page_objects/login.page';
import { SignupFormComponent } from '../../../support/page_objects/signup-form.component';
import { HeaderComponent } from '../../../support/page_objects/header.component';
import { CartPage } from '../../../support/page_objects/cart.page';
import { CheckoutPage } from '../../../support/page_objects/checkout.page';
import { PaymentPage } from '../../../support/page_objects/payment.page';
import { buildPaymentData } from '../../../support/factories/payment.factory';

const loginPage = new LoginPage();
const signupForm = new SignupFormComponent();
const header = new HeaderComponent();
const cartPage = new CartPage();
const checkoutPage = new CheckoutPage();
const paymentPage = new PaymentPage();

// WEB05-CT01 - e-mail já cadastrado

When('outro visitante tenta se cadastrar com o mesmo e-mail', () => {
  loginPage.visit();
  signupForm.fillAndSubmit('Outro Visitante', context.currentUser!.email);
});

Then('o sistema deve rejeitar o cadastro', () => {
  // Rejeição de negócio: o fluxo NÃO avança para o formulário completo
  // de dados da conta (a URL permanece em /signup com o erro exibido).
  signupForm.assertAccountFormNotReached();
});

Then('deve informar que o e-mail já está cadastrado', () => {
  signupForm.assertEmailAlreadyRegistered();
});

// WEB05-CT02 - login com campos obrigatórios vazios

Given('que o visitante está na página de acesso', () => {
  loginPage.visit();
});

When('ele solicita o acesso sem informar e-mail e senha', () => {
  loginPage.submitEmpty();
});

Then('o avanço deve ser bloqueado na página de acesso', () => {
  loginPage.assertBlockedOnLoginPage();
});

Then(
  'o campo de e-mail deve sinalizar a obrigatoriedade com mensagem associada',
  () => {
    loginPage.assertEmailRequiredViolation();
  },
);

// WEB05-CT03 - pagamento sem nome no cartão

Given('ele avançou até o pagamento', () => {
  header.goToCart();
  cartPage.proceedToCheckout();
  checkoutPage.placeOrder();
});

When('ele submete o pagamento sem informar o nome no cartão', () => {
  // Demais campos preenchidos com dados fictícios; apenas o nome fica vazio.
  paymentPage.fill(buildPaymentData({ nameOnCard: '' }));
  paymentPage.submit();
});

Then('o avanço deve ser bloqueado na página de pagamento', () => {
  paymentPage.assertBlockedOnPaymentPage();
});

Then(
  'o campo de nome do cartão deve sinalizar a obrigatoriedade com mensagem associada',
  () => {
    paymentPage.assertNameOnCardRequiredViolation();
  },
);
