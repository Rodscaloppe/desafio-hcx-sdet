import Ajv, { type ValidateFunction } from 'ajv';

/**
 * Validador de contrato (JSON Schema) para as respostas de API.
 *
 * A validação de campo de negócio (ex.: list.name) só deve ocorrer DEPOIS
 * de confirmada a estrutura — por isso o validator é chamado antes dos
 * asserts de valor nos steps de API.
 */
const ajv = new Ajv({ allErrors: true, strict: false });
const cache = new Map<string, ValidateFunction>();

export function assertSchema(
  schema: Record<string, unknown>,
  data: unknown,
  schemaName: string,
): void {
  let validate = cache.get(schemaName);
  if (!validate) {
    validate = ajv.compile(schema);
    cache.set(schemaName, validate);
  }
  const valid = validate(data);
  if (!valid) {
    const details = (validate.errors ?? [])
      .map((e) => `${e.instancePath || '/'} ${e.message}`)
      .join('; ');
    throw new Error(`Contrato violado em "${schemaName}": ${details}`);
  }
}
