import {
  Given,
  When,
  Then,
} from '@badeball/cypress-cucumber-preprocessor';
import { context } from '../../../support/context';
import { LoginPage } from '../../../support/page_objects/login.page';
import { HeaderComponent } from '../../../support/page_objects/header.component';

const loginPage = new LoginPage();
const header = new HeaderComponent();

// WEB01-CT01 - login com credenciais válidas

When('ele acessa a conta com suas credenciais válidas', () => {
  const { email, password } = context.currentUser!;
  cy.loginViaUi(email, password);
});

Then('o sistema deve autenticar o usuário', () => {
  header.assertAuthenticated();
});

Then('deve exibir a identificação do usuário conectado', () => {
  header.assertLoggedIn();
});

// WEB01-CT02 - senha inválida

When('ele informa uma senha inválida', () => {
  loginPage.visit();
  loginPage.fillCredentials(
    context.currentUser!.email,
    `senha-invalida-${Date.now()}`,
  );
});

When('solicita o acesso', () => {
  loginPage.submit();
});

Then('o sistema deve rejeitar a autenticação', () => {
  loginPage.assertBlockedOnLoginPage();
});

Then('deve informar que as credenciais são inválidas', () => {
  loginPage.assertInvalidCredentialsMessage();
});

Then('não deve criar uma sessão autenticada', () => {
  header.assertLoggedOut();
});

// WEB01-CT03 - logout

Given('que o usuário está autenticado', () => {
  cy.visit('/');
  header.assertLoggedIn();
});

When('ele solicita o encerramento da sessão', () => {
  header.logout();
});

Then('o sistema deve encerrar a sessão', () => {
  // O ambiente redireciona para a página de acesso após o logout.
  loginPage.assertBlockedOnLoginPage();
});

Then('deve oferecer novamente a opção de acesso', () => {
  header.assertLoggedOut();
});
