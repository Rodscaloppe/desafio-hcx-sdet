import { LoginPage } from '../page_objects/login.page';
import { HeaderComponent } from '../page_objects/header.component';

/**
 * Comandos de autenticação.
 *
 * Deliberadamente pequenos e coesos: o login via UI existe como comando
 * porque é pré-condição de várias features. O cenário da feature de
 * autenticação (WEB-01) continua exercitando o formulário via page object,
 * pois ali a UI de login É o objeto sob teste.
 */
Cypress.Commands.add('loginViaUi', (email: string, password: string) => {
  const loginPage = new LoginPage();
  const header = new HeaderComponent();
  loginPage.visit();
  loginPage.login(email, password);
  // Sincronização por estado observável (não por espera fixa):
  // o login só é considerado concluído quando o header reflete a sessão.
  header.assertLoggedIn();
});

Cypress.Commands.add('loginWithSession', (email: string, password: string) => {
  cy.session([email], () => {
    cy.loginViaUi(email, password);
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      /** Realiza login pela UI e aguarda o estado autenticado. */
      loginViaUi(email: string, password: string): Chainable<void>;
      /** Login com cache de sessão (cy.session) para pré-condições. */
      loginWithSession(email: string, password: string): Chainable<void>;
    }
  }
}
