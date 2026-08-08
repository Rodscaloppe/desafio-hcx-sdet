import {
  Given,
  When,
  Then,
} from '@badeball/cypress-cucumber-preprocessor';
import { context } from '../../../support/context';
import { ProductsPage } from '../../../support/page_objects/products.page';
import { ProductDetailPage } from '../../../support/page_objects/product-detail.page';
import { CartPage } from '../../../support/page_objects/cart.page';
import { CartModalComponent } from '../../../support/page_objects/cart-modal.component';

const productsPage = new ProductsPage();
const productDetailPage = new ProductDetailPage();
const cartPage = new CartPage();
const cartModal = new CartModalComponent();

// WEB03-CT01 / CT03 - inclusão a partir da listagem

When('ele adiciona o primeiro produto da listagem ao carrinho', () => {
  productsPage.firstCardInfo().then((info) => {
    context.cartExpectation = { ...info, quantity: 1 };
  });
  productsPage.addFirstProductToCart();
});

When('continua comprando', () => {
  cartModal.continueShopping();
});

When('adiciona o mesmo produto ao carrinho novamente', () => {
  productsPage.addFirstProductToCart();
  // Regra observada: a reinclusão SOMA a quantidade do mesmo item.
  context.cartExpectation!.quantity += 1;
});

When('acessa o carrinho', () => {
  cartModal.goToCart();
});

// WEB03-CT02 - quantidade a partir do detalhe do produto
// Massa controlada do ambiente: produto id=1 (catálogo público estável).
// Nome e preço NÃO são fixados no teste: são capturados no detalhe e
// comparados com o carrinho, mantendo o cenário determinístico.

Given('que o visitante está no detalhe de um produto', () => {
  productDetailPage.visit('1');
  cy.location('pathname').then((pathname) => {
    const productId = pathname.split('/').pop()!;
    productDetailPage.getInfo().then((info) => {
      context.cartExpectation = { productId, ...info, quantity: 1 };
    });
  });
});

When('ele define a quantidade desejada para 3 unidades', () => {
  productDetailPage.setQuantity(3);
  context.cartExpectation!.quantity = 3;
});

When('adiciona o produto ao carrinho', () => {
  productDetailPage.addToCart();
});

// Asserts de consistência (WEB-03)

Then('o carrinho deve exibir o mesmo produto e preço da listagem', () => {
  const { productId, name, price } = context.cartExpectation!;
  cartPage.assertItemIdentityMatches(productId, name, price);
});

Then('o carrinho deve exibir o mesmo produto e preço do detalhe', () => {
  const { productId, name, price } = context.cartExpectation!;
  cartPage.assertItemIdentityMatches(productId, name, price);
});

Then('a quantidade deve ser uma unidade', () => {
  cartPage.assertItemQuantity(context.cartExpectation!.productId, 1);
});

Then('a quantidade deve ser 3 unidades', () => {
  cartPage.assertItemQuantity(context.cartExpectation!.productId, 3);
});

Then('a quantidade deve ser 2 unidades', () => {
  cartPage.assertItemQuantity(context.cartExpectation!.productId, 2);
});

Then('o subtotal deve ser consistente com preço e quantidade', () => {
  const { productId, price, quantity } = context.cartExpectation!;
  cartPage.assertItemSubtotalConsistent(productId, price, quantity);
});

Then('o carrinho deve exibir uma única linha para o produto', () => {
  cartPage.assertSingleRowFor(context.cartExpectation!.productId);
});
