import { Given } from '@badeball/cypress-cucumber-preprocessor';
import { context } from '../../../support/context';
import { ProductsPage } from '../../../support/page_objects/products.page';
import { CartModalComponent } from '../../../support/page_objects/cart-modal.component';

/**
 * Steps compartilhados entre features web.
 * Definidos UMA única vez para preservar a paridade feature ↔ step.
 */

const productsPage = new ProductsPage();
const cartModal = new CartModalComponent();

Given('que existe um usuário cadastrado', () => {
  // O provisionamento acontece no hook @provisioned-user (API ou env).
  expect(context.currentUser, 'usuário provisionado pelo hook Before').to.not.eq(
    undefined,
  );
});

Given('que o visitante está no catálogo de produtos', () => {
  productsPage.visit();
  // Massa de referência: quantidade do catálogo completo capturada ao vivo,
  // usada pela fronteira de busca vazia sem hardcode de volume.
  productsPage.catalogSize().then((count) => {
    context.catalogCount = count;
  });
});

Given('que o usuário autenticado possui um produto no carrinho', () => {
  productsPage.visit();
  productsPage.firstCardInfo().then((info) => {
    context.cartExpectation = { ...info, quantity: 1 };
  });
  productsPage.addFirstProductToCart();
  cartModal.continueShopping();
});
