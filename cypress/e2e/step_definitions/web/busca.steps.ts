import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { context } from '../../../support/context';
import { ProductsPage } from '../../../support/page_objects/products.page';

const productsPage = new ProductsPage();

// WEB02-CT01 / CT02 / CT04 - buscas com e sem correspondência

When('ele busca por um termo com correspondência', () => {
  cy.fixture('busca').then((busca: { termoComCorrespondencia: string }) => {
    context.searchTerm = busca.termoComCorrespondencia;
    productsPage.search(context.searchTerm);
  });
});

When('ele busca por um termo sem correspondência', () => {
  cy.fixture('busca').then((busca: { termoSemCorrespondencia: string }) => {
    context.searchTerm = busca.termoSemCorrespondencia;
    productsPage.search(context.searchTerm);
  });
});

When('ele busca por um termo com correspondência cercado de espaços', () => {
  cy.fixture('busca').then((busca: { termoComCorrespondencia: string }) => {
    context.searchTerm = busca.termoComCorrespondencia;
    productsPage.search(`  ${busca.termoComCorrespondencia}  `);
  });
});

// WEB02-CT03 - busca vazia (fronteira)

When('ele aciona a busca sem informar um termo', () => {
  context.searchTerm = '';
  productsPage.search('');
});

// Asserts compartilhados de resultado

Then('o sistema deve exibir a seção de resultados da busca', () => {
  productsPage.assertSearchExecuted();
});

Then('devem ser exibidos produtos correspondentes ao termo buscado', () => {
  // Regra de correspondência OBSERVADA: o resultado relaciona-se ao termo
  // (nome e/ou descrição — inferência documentada no README). Asserts de
  // negócio: há resultados, ao menos um nome contém o termo e todos os
  // cards exibem nome e preço íntegros.
  const termo = new RegExp(context.searchTerm!, 'i');
  productsPage.resultCards().then(($cards) => {
    expect($cards.length, 'quantidade de resultados').to.be.greaterThan(0);
    const cards = $cards.toArray();
    const nomes = cards.map((c) => Cypress.$(c).find('p').first().text());
    expect(
      nomes.some((n) => termo.test(n)),
      `ao menos um produto contém "${context.searchTerm}" no nome`,
    ).to.eq(true);
    cards.forEach((c) => {
      const $c = Cypress.$(c);
      expect($c.find('p').first().text().trim(), 'nome do produto').to.not.eq(
        '',
      );
      expect($c.find('h2').first().text(), 'preço do produto').to.match(
        /Rs\.\s*\d+/,
      );
    });
  });
});

Then('não deve listar nenhum produto', () => {
  productsPage.resultCards().should('not.exist');
});

Then('deve manter a exibição do catálogo completo', () => {
  // Comportamento observado e documentado: acionar a busca com o campo
  // vazio NÃO navega — a listagem completa ("All Products") permanece.
  cy.contains('h2.title', 'All Products').should('be.visible');
  productsPage
    .resultCards()
    .its('length')
    .should('eq', context.catalogCount);
});
