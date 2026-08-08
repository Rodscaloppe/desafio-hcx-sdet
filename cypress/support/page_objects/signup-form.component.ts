/**
 * Formulário inicial de cadastro (lado direito da /login).
 * Usado pela WEB-05 para validar regra de e-mail duplicado.
 */
export class SignupFormComponent {
  private readonly form = '.signup-form';
  private readonly nameInput = '[data-qa="signup-name"]';
  private readonly emailInput = '[data-qa="signup-email"]';
  private readonly signupButton = '[data-qa="signup-button"]';

  fillAndSubmit(name: string, email: string): void {
    cy.get(this.nameInput).clear();
    cy.get(this.nameInput).type(name);
    cy.get(this.emailInput).clear();
    cy.get(this.emailInput).type(email);
    cy.get(this.signupButton).click();
  }

  assertEmailAlreadyRegistered(): void {
    cy.contains(this.form + ' p', /email address already exist/i).should(
      'be.visible',
    );
  }

  /**
   * Pós-condição de cadastro rejeitado: o formulário completo de dados da
   * conta (campo de senha do cadastro) NÃO é exibido — o visitante
   * permanece na tela de acesso/cadastro inicial.
   */
  assertAccountFormNotReached(): void {
    cy.get('[data-qa="password"]').should('not.exist');
  }
}
