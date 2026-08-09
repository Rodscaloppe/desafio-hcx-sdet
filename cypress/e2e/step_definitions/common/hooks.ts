import { Before, After } from '@badeball/cypress-cucumber-preprocessor';
import { context } from '../../../support/context';
import { buildUser } from '../../../support/factories/user.factory';
import {
  apiDeleteAccount,
  apiTryCreateAccount,
} from '../../../support/api/automation-exercise.client';
import {
  getConfig,
  hasConfiguredTestUser,
  provisioningStrategy,
} from '../../../support/env';
import { SignupPage } from '../../../support/page_objects/signup.page';
import { HeaderComponent } from '../../../support/page_objects/header.component';
import { LoginPage } from '../../../support/page_objects/login.page';

/**
 * Hooks de ciclo de vida dos cenários.
 *
 * Estratégia de dados (hipótese documentada no README):
 * - @provisioned-user: se o avaliador forneceu TEST_USER_EMAIL/PASSWORD,
 *   usamos essa conta e NUNCA a removemos; caso contrário, provisionamos
 *   uma conta única por cenário.
 * - Provisionamento ADAPTATIVO (PROVISIONING_STRATEGY, padrão 'auto'):
 *   tenta a API (rápido, programático); se o endpoint estiver bloqueado
 *   por anti-bot (datacenter), cai para o cadastro completo pela UI —
 *   a navegação web não é afetada pelo bloqueio. O caminho usado fica
 *   registrado no log do cenário e no contexto.
 * - @authenticated: estabelece a sessão via cy.session (cache por e-mail),
 *   evitando repetir o login pela UI fora da feature de autenticação.
 * - Teardown: contas criadas pela suíte são removidas pelo MESMO caminho
 *   do provisionamento (API deleteAccount ou UI "Delete Account").
 */

const signupPage = new SignupPage();
const header = new HeaderComponent();
const loginPage = new LoginPage();

/**
 * Provisiona a conta pela UI e devolve o cenário ao estado de visitante
 * anônimo (o cadastro pela UI inicia a sessão automaticamente; o logout
 * iguala o estado inicial ao do provisionamento via API).
 */
function provisionViaUi(user: ReturnType<typeof buildUser>): void {
  signupPage.registerViaUi(user);
  header.logout();
  header.assertLoggedOut();
}

Before(() => {
  context.reset();
});

Before({ tags: '@provisioned-user' }, () => {
  if (hasConfiguredTestUser()) {
    const { testUser } = getConfig();
    context.currentUser = buildUser({
      email: testUser.email,
      password: testUser.password,
    });
    context.provisionedBySuite = false;
    return;
  }
  const user = buildUser();
  context.currentUser = user;
  context.provisionedBySuite = true;

  if (provisioningStrategy() === 'ui') {
    cy.log('Provisionamento via UI (PROVISIONING_STRATEGY=ui)');
    provisionViaUi(user);
    context.provisioningMethod = 'ui';
    return;
  }

  apiTryCreateAccount(user).then((result) => {
    if (result.blocked) {
      if (provisioningStrategy() === 'api') {
        throw new Error(
          '[BLOQUEIO DE AMBIENTE] API de provisionamento bloqueada e ' +
            'PROVISIONING_STRATEGY=api não permite fallback para UI.',
        );
      }
      cy.log('API bloqueada por anti-bot: provisionamento via UI (fallback)');
      provisionViaUi(user);
      context.provisioningMethod = 'ui';
      return;
    }
    expect(
      result.observation.body.responseCode,
      'provisionamento do usuário via API',
    ).to.eq(201);
    context.provisioningMethod = 'api';
  });
});

Before({ tags: '@authenticated' }, () => {
  const user = context.currentUser;
  if (!user) {
    throw new Error(
      'Cenário @authenticated exige um usuário provisionado (tag @provisioned-user ausente).',
    );
  }
  cy.loginWithSession(user.email, user.password);
});

After({ tags: '@provisioned-user' }, () => {
  if (!context.provisionedBySuite || !context.currentUser) {
    return;
  }
  const { email, password } = context.currentUser;
  if (context.provisioningMethod === 'ui') {
    // A conta foi criada pela UI; a remoção também é pela UI. O estado de
    // sessão ao fim do cenário é desconhecido (ex.: cenário de logout
    // invalida a sessão no servidor — cache de cy.session não serve aqui),
    // então o teardown observa o estado e só então decide o caminho.
    cy.visit('/');
    cy.get('.navbar-nav').then(($nav) => {
      const autenticado = $nav.find('a[href="/logout"]').length > 0;
      if (!autenticado) {
        loginPage.visit();
        loginPage.login(email, password);
        header.assertLoggedIn();
      }
    });
    header.deleteAccount();
    return;
  }
  apiDeleteAccount(email, password).then((response) => {
    expect(
      response.body.responseCode,
      'teardown: remoção da conta provisionada pela suíte',
    ).to.eq(200);
  });
});
