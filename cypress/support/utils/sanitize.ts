/**
 * Sanitização de dados sensíveis antes de registrar evidências/logs.
 *
 * Regra: nenhum segredo (key, token, senha, authorization) pode aparecer em
 * artefatos de execução, relatórios ou logs — nem mesmo em falhas.
 */
const SENSITIVE_KEY = /key|token|password|authorization|secret/i;
const MASK = '***';

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>);
  }
  return value;
}

export function sanitizeObject(
  input: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      SENSITIVE_KEY.test(key) ? MASK : sanitizeValue(value),
    ]),
  );
}

/** Remove credenciais de query strings antes de logar URLs. */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const param of Array.from(parsed.searchParams.keys())) {
      if (SENSITIVE_KEY.test(param)) {
        parsed.searchParams.set(param, MASK);
      }
    }
    return parsed.toString();
  } catch {
    // Fallback para URLs relativas: mascara pares sensíveis por regex.
    return url.replace(
      /([?&](?:key|token|password|authorization|secret)=)[^&]*/gi,
      `$1${MASK}`,
    );
  }
}
