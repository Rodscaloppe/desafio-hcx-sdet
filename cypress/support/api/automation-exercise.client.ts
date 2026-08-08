import { getConfig } from '../env';
import type { ApiObservation } from '../context';
import {
  toCreateAccountPayload,
  type TestUser,
} from '../factories/user.factory';

/**
 * Cliente da API pública do Automation Exercise.
 *
 * Camada de API SEPARADA da camada visual: reutilizável por qualquer step
 * ou hook sem passar pela UI. Todas as chamadas usam failOnStatusCode:false
 * porque a API responde HTTP 200 mesmo em erro de negócio — o contrato
 * real é o campo `responseCode` no corpo (quirk documentado no README).
 */
export interface AeApiBody {
  responseCode: number;
  message: string;
}

function normalizeBody(raw: unknown): AeApiBody {
  // A API pode responder com content-type text/html; nesse caso o corpo
  // chega como string e precisa ser parseado antes da validação.
  if (typeof raw === 'string') {
    return JSON.parse(raw) as AeApiBody;
  }
  return raw as AeApiBody;
}

function toObservation(
  response: Cypress.Response<unknown>,
): ApiObservation {
  return {
    status: response.status,
    headers: response.headers as Record<string, string>,
    body: normalizeBody(response.body),
  };
}

function postForm(
  path: string,
  body: Record<string, string>,
): Cypress.Chainable<ApiObservation> {
  return cy
    .request({
      method: 'POST',
      url: `${getConfig().aeApiUrl}${path}`,
      form: true,
      body,
      failOnStatusCode: false,
    })
    .then(toObservation);
}

export function apiCreateAccount(
  user: TestUser,
): Cypress.Chainable<ApiObservation> {
  return postForm('/createAccount', toCreateAccountPayload(user));
}

export function apiCreateAccountRaw(
  payload: Record<string, string>,
): Cypress.Chainable<ApiObservation> {
  return postForm('/createAccount', payload);
}

export function apiDeleteAccount(
  email: string,
  password: string,
): Cypress.Chainable<ApiObservation> {
  return cy
    .request({
      method: 'DELETE',
      url: `${getConfig().aeApiUrl}/deleteAccount`,
      form: true,
      body: { email, password },
      failOnStatusCode: false,
    })
    .then(toObservation);
}

export function apiVerifyLogin(
  email: string,
  password: string,
): Cypress.Chainable<ApiObservation> {
  return postForm('/verifyLogin', { email, password });
}
