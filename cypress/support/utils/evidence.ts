import { sanitizeObject, sanitizeUrl } from './sanitize';

/**
 * Registro de evidência reproduzível para chamadas de API.
 *
 * Em falha (ou sob demanda), persiste request/response SANITIZADOS em
 * cypress/evidencias/, permitindo reproduzir a falha sem expor segredos.
 */
export interface ApiEvidence {
  request: {
    method: string;
    url: string;
    body?: Record<string, unknown>;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: unknown;
  };
  timestamp: string;
}

export function persistApiEvidence(
  name: string,
  evidence: ApiEvidence,
): Cypress.Chainable<null> {
  const sanitized: ApiEvidence = {
    request: {
      method: evidence.request.method,
      url: sanitizeUrl(evidence.request.url),
      body: evidence.request.body
        ? sanitizeObject(evidence.request.body)
        : undefined,
    },
    response: evidence.response,
    timestamp: evidence.timestamp,
  };
  return cy.writeFile(`cypress/evidencias/${name}.json`, sanitized);
}

export function buildEvidence(
  request: ApiEvidence['request'],
  response: ApiEvidence['response'],
): ApiEvidence {
  return { request, response, timestamp: new Date().toISOString() };
}
