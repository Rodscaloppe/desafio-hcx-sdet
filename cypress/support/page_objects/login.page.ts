/**
 * Página de autenticação (/login).
 * Seletores data-qa estáveis fornecidos pela própria aplicação.
 */
export class LoginPage {
  private readonly form = '.login-form';
  private readonly emailInput = '[data-qa="login-email"]';
  private readonly passwordInput = '[data-qa="login-password"]';
  private readonly loginButton = '[data-qa="login-button"]';

  visit(): void {
    cy.visit('/login');
  }

  /** Fluxo completo (usado também pelo comando de sessão). */
  login(email: string, password: string): void {
    this.fillCredentials(email, password);
    this.submit();
  }

  fillCredentials(email: string, password: string): void {
    cy.get(this.emailInput).clear();
    cy.get(this.emailInput).type(email);
    cy.get(this.passwordInput).clear();
    cy.get(this.passwordInput).type(password, { log: false });
  }

  submit(): void {
    cy.get(this.loginButton).click();
  }

  submitEmpty(): void {
    cy.get(this.loginButton).click();
  }

  /** Pós-condição de autenticação rejeitada: permanecemos na página de acesso. */
  assertBlockedOnLoginPage(): void {
    cy.location('pathname').should('eq', '/login');
  }

  /**
   * Mensagem de credenciais inválidas: verificável por texto associado ao
   * formulário de login (não apenas por cor).
   */
  assertInvalidCredentialsMessage(): void {
    cy.contains(this.form + ' p', /email or password is incorrect/i).should(
      'be.visible',
    );
  }

  /**
   * Validação de campo obrigatório via API de validade do HTML5:
   * a mensagem pertence ao campo (validationMessage), não a um alerta solto.
   */
  assertEmailRequiredViolation(): void {
    cy.get(this.emailInput).then(($input) => {
      const input = $input.get(0) as HTMLInputElement;
      expect(input.validity.valueMissing, 'campo e-mail obrigatório').to.eq(
        true,
      );
      expect(
        input.validationMessage,
        'mensagem associada ao campo',
      ).to.not.eq('');
    });
  }
}
