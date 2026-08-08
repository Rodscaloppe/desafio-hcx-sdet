import { Before, After } from '@badeball/cypress-cucumber-preprocessor';
import { context } from '../../../support/context';
import { buildUser } from '../../../support/factories/user.factory';
import {
  apiCreateAccount,
  apiDeleteAccount,
} from '../../../support/api/automation-exercise.client';
import { getConfig, hasConfiguredTestUser } from '../../../support/env';

/**
 * Hooks de ciclo de vida dos cenários.
 *
 * Estratégia de dados (hipótese documentada no README):
 * - @provisioned-user: se o avaliador forneceu TEST_USER_EMAIL/PASSWORD,
 *   usamos essa conta e NUNCA a removemos; caso contrário, provisionamos
 *   uma conta única via API (setup programático, sem passar pela UI).
 * - @authenticated: estabelece a sessão via cy.session (cache por e-mail),
 *   evitando repetir o login pela UI fora da feature de autenticação.
 * - Teardown: contas criadas pela suíte são removidas via API (deleteAccount),
 *   tornando a geração de dados idempotente entre execuções.
 */

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
  apiCreateAccount(user).then((response) => {
    expect(
      response.body.responseCode,
      'provisionamento do usuário via API',
    ).to.eq(201);
    context.currentUser = user;
    context.provisionedBySuite = true;
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
  if (context.provisionedBySuite && context.currentUser) {
    const { email, password } = context.currentUser;
    apiDeleteAccount(email, password).then((response) => {
      expect(
        response.body.responseCode,
        'teardown: remoção da conta provisionada pela suíte',
      ).to.eq(200);
    });
  }
});
