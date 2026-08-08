import { getConfig } from '../env';
import { buildEvidence, persistApiEvidence } from '../utils/evidence';

/**
 * Cliente da API Trello (API-01).
 *
 * Endpoint, credenciais e lista sob teste são 100% configuráveis via
 * ambiente. Em caso de falha inesperada, request/response SANITIZADOS
 * são persistidos em cypress/evidencias/ para reprodução.
 */
export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  idBoard: string;
  pos: number;
  [key: string]: unknown;
}

export interface TrelloResponse {
  status: number;
  headers: Record<string, string>;
  body: TrelloList | Record<string, unknown>;
}

function getListRaw(
  listId: string,
  auth: { key?: string; token?: string },
): Cypress.Chainable<TrelloResponse> {
  const { trello } = getConfig();
  const url = `${trello.apiBase}/lists/${listId}`;
  return cy
    .request({
      method: 'GET',
      url,
      qs: { key: auth.key, token: auth.token },
      failOnStatusCode: false,
    })
    .then((response) => {
      const result: TrelloResponse = {
        status: response.status,
        headers: response.headers as Record<string, string>,
        body: response.body as TrelloList,
      };
      // Evidência sanitizada persistida quando a chamada falha de forma
      // não esperada (5xx/indisponibilidade) — classificada na triagem.
      if (response.status >= 500) {
        persistApiEvidence(
          `trello-get-list-${Date.now()}`,
          buildEvidence(
            {
              method: 'GET',
              url,
              body: auth as Record<string, unknown>,
            },
            {
              status: response.status,
              headers: result.headers,
              body: response.body,
            },
          ),
        );
      }
      return cy.wrap(result);
    });
}

/** GET /1/lists/{id} autenticado (credenciais do ambiente). */
export function trelloGetList(listId: string): Cypress.Chainable<TrelloResponse> {
  const { trello } = getConfig();
  return getListRaw(listId, { key: trello.key, token: trello.token });
}

/** GET /1/lists/{id} SEM credenciais — exercita a recusa sem autenticação. */
export function trelloGetListWithoutCredentials(
  listId = 'invalid-list-id',
): Cypress.Chainable<TrelloResponse> {
  return getListRaw(listId, {});
}

/**
 * GET /1/lists/{id} com credenciais inválidas — contrato de erro 401.
 * O identificador é bem formado (24 hex) e inexistente: assim a recusa
 * observada decorre da AUTENTICAÇÃO (401 "invalid key"), e não da
 * validação de formato do id (400) nem da inexistência do recurso (404).
 */
export function trelloGetListWithInvalidCredentials(
  listId = '000000000000000000000001',
): Cypress.Chainable<TrelloResponse> {
  return getListRaw(listId, { key: 'chave-invalida', token: 'token-invalido' });
}
