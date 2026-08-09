import type { TestUser } from '../factories/user.factory';
import { LoginPage } from './login.page';
import { SignupFormComponent } from './signup-form.component';

/**
 * Fluxo COMPLETO de cadastro pela UI (/login → /signup → conta criada).
 *
 * Usado como caminho alternativo de provisionamento quando a API pública
 * está bloqueada por anti-bot (datacenter): a navegação web passa pelo
 * Cloudflare normalmente. Também serve como dogfooding do fluxo real de
 * registro do produto.
 */
export class SignupPage {
  private readonly loginPage = new LoginPage();
  private readonly signupForm = new SignupFormComponent();

  // Formulário completo de dados da conta (/signup)
  private readonly titleMr = '#id_gender1';
  private readonly password = '[data-qa="password"]';
  private readonly days = '[data-qa="days"]';
  private readonly months = '[data-qa="months"]';
  private readonly years = '[data-qa="years"]';
  private readonly firstName = '[data-qa="first_name"]';
  private readonly lastName = '[data-qa="last_name"]';
  private readonly company = '[data-qa="company"]';
  // Quirk de testabilidade do produto: o primeiro endereço usa
  // data-qa="address" (não "address1" como o padrão dos demais campos).
  private readonly address1 = '[data-qa="address"]';
  private readonly address2 = '[data-qa="address2"]';
  private readonly country = '[data-qa="country"]';
  private readonly state = '[data-qa="state"]';
  private readonly city = '[data-qa="city"]';
  private readonly zipcode = '[data-qa="zipcode"]';
  private readonly mobileNumber = '[data-qa="mobile_number"]';
  private readonly createAccountButton = '[data-qa="create-account"]';
  private readonly accountCreatedMessage = '[data-qa="account-created"]';
  private readonly continueButton = '[data-qa="continue-button"]';

  /**
   * Registra o usuário pela UI. ATENÇÃO: o ambiente inicia a sessão
   * automaticamente após o cadastro — quem provisiona para testes deve
   * normalizar o estado (ver provisionViaUi em common/hooks.ts).
   */
  registerViaUi(user: TestUser): void {
    this.loginPage.visit();
    this.signupForm.fillAndSubmit(user.name, user.email);
    // Sincronização por estado: o formulário completo só aparece após o
    // redirecionamento do /signup.
    cy.get(this.password).should('be.visible');

    cy.get(this.titleMr).check();
    cy.get(this.password).type(user.password, { log: false });
    cy.get(this.days).select(user.birthDate);
    cy.get(this.months).select(user.birthMonth);
    cy.get(this.years).select(user.birthYear);
    cy.get(this.firstName).type(user.firstName);
    cy.get(this.lastName).type(user.lastName);
    cy.get(this.company).type(user.company);
    cy.get(this.address1).type(user.address1);
    cy.get(this.address2).type(user.address2);
    cy.get(this.country).select(user.country);
    cy.get(this.state).type(user.state);
    cy.get(this.city).type(user.city);
    cy.get(this.zipcode).type(user.zipcode);
    cy.get(this.mobileNumber).type(user.mobileNumber);
    cy.get(this.createAccountButton).click();

    cy.get(this.accountCreatedMessage).should('be.visible');
    cy.get(this.continueButton).click();
  }
}
