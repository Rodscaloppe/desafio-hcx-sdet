/**
 * Componente de navegação global (header).
 * Seletores por href estável/semântico; nenhum depende de classe visual.
 */
export class HeaderComponent {
  private readonly links = {
    login: '.navbar-nav a[href="/login"]',
    logout: '.navbar-nav a[href="/logout"]',
    products: '.navbar-nav a[href="/products"]',
    cart: '.navbar-nav a[href="/view_cart"]',
    deleteAccount: '.navbar-nav a[href="/delete_account"]',
  };

  goToLogin(): void {
    cy.get(this.links.login).click();
  }

  goToProducts(): void {
    cy.get(this.links.products).first().click();
  }

  goToCart(): void {
    cy.get(this.links.cart).first().click();
  }

  logout(): void {
    cy.get(this.links.logout).click();
  }

  /** Sessão autenticada: opção de logout visível no header. */
  assertAuthenticated(): void {
    cy.get(this.links.logout).should('be.visible');
  }

  /** Identificação do usuário: "Logged in as <nome>" no header. */
  assertLoggedIn(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('.navbar-nav li', 'Logged in as').should('be.visible');
  }

  /** Pós-condição de logout: header volta a oferecer Signup / Login. */
  assertLoggedOut(): void {
    cy.get(this.links.logout).should('not.exist');
    cy.get(this.links.login).should('be.visible');
  }

  /** Exclui a conta da sessão atual (teardown via UI). */
  deleteAccount(): void {
    cy.get(this.links.deleteAccount).click();
    // O texto do DOM é "Account Deleted!" — o uppercase é via CSS
    // (text-transform); por isso a correspondência é case-insensitive.
    cy.contains(/account deleted!/i).should('be.visible');
    cy.get('[data-qa="continue-button"]').click();
  }
}
