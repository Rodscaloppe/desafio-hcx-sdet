/**
 * Acesso centralizado e tipado à configuração de ambiente.
 *
 * Toda variável sensível ao ambiente é lida aqui (via Cypress.env, populada
 * a partir de .env/CI no cypress.config.ts). Nenhum segredo é versionado;
 * apenas os NOMES das variáveis aparecem no código.
 */
export interface TestConfig {
  baseUrl: string;
  aeApiUrl: string;
  testUser: { email: string; password: string };
  trello: {
    apiBase: string;
    key: string;
    token: string;
    listId: string;
  };
}

export function getConfig(): TestConfig {
  return {
    baseUrl: Cypress.config('baseUrl') as string,
    aeApiUrl: Cypress.env('AE_API_URL') as string,
    testUser: {
      email: (Cypress.env('TEST_USER_EMAIL') as string) ?? '',
      password: (Cypress.env('TEST_USER_PASSWORD') as string) ?? '',
    },
    trello: {
      apiBase: Cypress.env('TRELLO_API_BASE') as string,
      key: (Cypress.env('TRELLO_API_KEY') as string) ?? '',
      token: (Cypress.env('TRELLO_API_TOKEN') as string) ?? '',
      listId: (Cypress.env('TRELLO_LIST_ID') as string) ?? '',
    },
  };
}

/** Indica se o avaliador forneceu um usuário pré-existente via ambiente. */
export function hasConfiguredTestUser(): boolean {
  const { testUser } = getConfig();
  return Boolean(testUser.email && testUser.password);
}

/** Indica se a integração Trello autenticada está configurada. */
export function hasTrelloCredentials(): boolean {
  const { trello } = getConfig();
  return Boolean(trello.key && trello.token && trello.listId);
}

/**
 * Guarda de configuração para cenários @trello-auth: falha explicitamente
 * (bloqueio de ambiente, nunca mascarado) quando as credenciais não existem.
 */
export function requireTrelloCredentials(): void {
  if (!hasTrelloCredentials()) {
    throw new Error(
      '[BLOQUEIO DE AMBIENTE] Cenário @trello-auth requer TRELLO_API_KEY, ' +
        'TRELLO_API_TOKEN e TRELLO_LIST_ID configurados no ambiente. ' +
        'Sem eles, este cenário não pode ser executado de forma reproduzível.',
    );
  }
}
