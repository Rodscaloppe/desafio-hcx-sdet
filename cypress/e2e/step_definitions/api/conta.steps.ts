import {
  Given,
  When,
  Then,
} from '@badeball/cypress-cucumber-preprocessor';
import { context } from '../../../support/context';
import {
  buildUser,
  toCreateAccountPayload,
} from '../../../support/factories/user.factory';
import {
  apiCreateAccount,
  apiCreateAccountRaw,
  apiDeleteAccount,
} from '../../../support/api/automation-exercise.client';
import { assertSchema } from '../../../support/api/schema-validator';
import aeApiMessageSchema from '../../../schemas/ae-api-message.schema.json';

// API02-CT01/CT03 - massa única por cenário (idempotência)

Given('que foi gerada uma conta de teste com dados únicos', () => {
  context.currentUser = buildUser();
});

Given(
  'que foi gerada uma conta de teste sem o parâmetro {string}',
  (parametro: string) => {
    context.currentUser = buildUser();
    const payload = toCreateAccountPayload(context.currentUser);
    delete payload[parametro];
    context.apiPayload = payload;
  },
);

Given('a conta já existe na loja', () => {
  apiCreateAccount(context.currentUser!).then((response) => {
    expect(response.body.responseCode, 'pré-condição: conta criada').to.eq(
      201,
    );
  });
});

When('a criação da conta é solicitada à API', () => {
  const payload =
    context.apiPayload ?? toCreateAccountPayload(context.currentUser!);
  apiCreateAccountRaw(payload).then((response) => {
    context.lastApiResponse = response;
  });
});

// Asserts de status, contrato e regra de negócio

Then('a API deve responder com sucesso', () => {
  // Expectativa de status declarada: a API responde HTTP 200 inclusive em
  // erro de negócio; o resultado real é o responseCode do corpo (quirk
  // documentado no README e na feature).
  expect(context.lastApiResponse!.status, 'HTTP status').to.eq(200);
});

Then('o corpo deve seguir o contrato padrão da API', () => {
  assertSchema(
    aeApiMessageSchema,
    context.lastApiResponse!.body,
    'ae-api-message',
  );
});

Then('a regra de negócio deve confirmar a conta criada', () => {
  const { body } = context.lastApiResponse!;
  expect(body.responseCode, 'responseCode de negócio').to.eq(201);
  expect(body.message, 'mensagem de negócio').to.eq('User created!');
});

Then(
  'a regra de negócio deve rejeitar a requisição por parâmetro ausente {string}',
  (parametro: string) => {
    const { body } = context.lastApiResponse!;
    expect(body.responseCode, 'responseCode de negócio').to.eq(400);
    expect(body.message, 'mensagem de negócio').to.include(
      `${parametro} parameter is missing`,
    );
  },
);

Then('a regra de negócio deve rejeitar a requisição por e-mail duplicado', () => {
  const { body } = context.lastApiResponse!;
  expect(body.responseCode, 'responseCode de negócio').to.eq(400);
  expect(body.message, 'mensagem de negócio').to.eq('Email already exists!');
});

// Estratégia de limpeza explícita (teardown dentro do cenário)

Then('a conta criada deve ser removida no encerramento do cenário', () => {
  const { email, password } = context.currentUser!;
  apiDeleteAccount(email, password).then((response) => {
    expect(response.body.responseCode, 'limpeza da conta criada').to.eq(200);
    expect(response.body.message).to.eq('Account deleted!');
  });
});
