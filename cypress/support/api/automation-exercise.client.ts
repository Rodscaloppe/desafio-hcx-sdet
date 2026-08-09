import { getConfig } from '../env';
import type { ApiObservation } from '../context';
import { buildEvidence, persistApiEvidence } from '../utils/evidence';
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
 * vindas de IPs de datacenter (observado na CI hospedada). Enviamos headers
 * de navegador explicitamente — são chamadas reais, sem mascaramento — e,
 * se ainda assim houver bloqueio, ele é classificado como ambiente.
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
      throw new Error(
        '[BLOQUEIO DE AMBIENTE] A API respondeu conteúdo não-JSON ' +
          '(provável challenge anti-bot em IP de datacenter). ' +
          `Trecho: ${raw.slice(0, 120)}`,
      );
    }
  }
  return raw as AeApiBody;
}

/** Assinatura de bloqueio anti-bot: 403 + headers Cloudflare. */
export function isAmbienteBloqueado(response: {
  status: number;
  headers: Record<string, string>;
}): boolean {
  const headerNames = Object.keys(response.headers).map((h) =>
    h.toLowerCase(),
  );
  const server = String(response.headers['server'] ?? '').toLowerCase();
  return (
    response.status === 403 &&
    (server.includes('cloudflare') || headerNames.includes('cf-ray'))
  );
}

/**
 * Converte a resposta crua do Cypress em observação, tratando o bloqueio
 * de ambiente com evidência persistida e erro classificado para a triagem.
 */
function observar(
  request: { method: string; url: string; body?: Record<string, string> },
  response: Cypress.Response<unknown>,
): ApiObservation {
  const observation: ApiObservation = {
    status: response.status,
    headers: response.headers as Record<string, string>,
    body: response.body,
  };
  if (isAmbienteBloqueado(observation)) {
    persistApiEvidence(
      `bloqueio-ambiente-${Date.now()}`,
      buildEvidence(request, {
        status: observation.status,
        headers: observation.headers,
        body: '(corpo de challenge anti-bot omitido)',
      }),
    );
    throw new Error(
      '[BLOQUEIO DE AMBIENTE] A API respondeu 403 com assinatura de ' +
        'anti-bot (Cloudflare): o endpoint público bloqueia IPs de ' +
        'datacenter. Executar a suíte em rede permitida (local/self-hosted).',
    );
  }
  return { ...observation, body: normalizeBody(response.body) };
}

function postForm(
  path: string,
  body: Record<string, string>,
): Cypress.Chainable<ApiObservation> {
  const url = `${getConfig().aeApiUrl}${path}`;
  return cy
    .request({
      method: 'POST',
      url,
      headers: BROWSER_HEADERS,
      form: true,
      body,
      failOnStatusCode: false,
    })
    .then((response) => observar({ method: 'POST', url, body }, response));
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
  const url = `${getConfig().aeApiUrl}/deleteAccount`;
  return cy
    .request({
      method: 'DELETE',
      url,
      headers: BROWSER_HEADERS,
      form: true,
      body: { email, password },
      failOnStatusCode: false,
    })
    .then((response) =>
      observar({ method: 'DELETE', url, body: { email, password } }, response),
    );
}

export function apiVerifyLogin(
  email: string,
  password: string,
): Cypress.Chainable<ApiObservation> {
  return postForm('/verifyLogin', { email, password });
}

/**
 * Variante não explosiva para hooks de provisionamento: em vez de lançar
 * erro em bloqueio anti-bot, retorna { blocked: true } — permitindo ao
 * chamador escolher o caminho alternativo (provisionamento via UI).
 */
export function apiTryCreateAccount(
  user: TestUser,
): Cypress.Chainable<
  { blocked: true } | { blocked: false; observation: ApiObservation }
> {
  const url = `${getConfig().aeApiUrl}/createAccount`;
  const body = toCreateAccountPayload(user);
  return cy
    .request({
      method: 'POST',
      url,
      headers: BROWSER_HEADERS,
      form: true,
      body,
      failOnStatusCode: false,
    })
    .then((response) => {
      const base: ApiObservation = {
        status: response.status,
        headers: response.headers as Record<string, string>,
        body: response.body,
      };
      if (isAmbienteBloqueado(base)) {
        persistApiEvidence(
          `bloqueio-ambiente-${Date.now()}`,
          buildEvidence(
            { method: 'POST', url, body },
            {
              status: base.status,
              headers: base.headers,
              body: '(corpo de challenge anti-bot omitido)',
            },
          ),
        );
        return { blocked: true as const };
      }
      return {
        blocked: false as const,
        observation: { ...base, body: normalizeBody(response.body) },
      };
    });
}
