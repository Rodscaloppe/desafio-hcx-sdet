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
 *
 * Headers: o site público fica atrás de Cloudflare, que desafia requisições
 * sem cara de navegador vindas de IPs de datacenter (observado na CI
 * hospedada: /api/* respondia HTML de challenge). Enviamos headers de
 * navegador explicitamente — são chamadas reais, sem mascaramento.
 */
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};
export interface AeApiBody {
  responseCode: number;
  message: string;
}

function normalizeBody(raw: unknown): AeApiBody {
  // A API pode responder com content-type text/html; nesse caso o corpo
  // chega como string e precisa ser parseado antes da validação.
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as AeApiBody;
    } catch {
      // Resposta HTML em endpoint JSON = challenge de bot (Cloudflare) —
      // classificado como bloqueio de ambiente, nunca como defeito de produto.
      throw new Error(
        '[BLOQUEIO DE AMBIENTE] A API respondeu conteúdo não-JSON ' +
          '(provável challenge anti-bot em IP de datacenter). ' +
          `Trecho: ${raw.slice(0, 120)}`,
      );
    }
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
      headers: BROWSER_HEADERS,
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
      headers: BROWSER_HEADERS,
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
