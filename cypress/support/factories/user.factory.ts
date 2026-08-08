/**
 * Fábrica de usuários de teste.
 *
 * Gera dados únicos por execução (timestamp + aleatório) usando o domínio
 * reservado example.com (RFC 2606): nenhum dado real é utilizado.
 * A unicidade viabiliza a estratégia idempotente de criar/remover contas
 * sem colisão entre execuções.
 */
export interface TestUser {
  name: string;
  email: string;
  password: string;
  title: 'Mr' | 'Mrs';
  birthDate: string;
  birthMonth: string;
  birthYear: string;
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  zipcode: string;
  state: string;
  city: string;
  mobileNumber: string;
}

export function buildUser(overrides: Partial<TestUser> = {}): TestUser {
  const unique = `${Date.now()}.${Math.floor(Math.random() * 1e6)}`;
  return {
    name: `QA HCX ${unique}`,
    email: `qa.hcx.${unique}@example.com`,
    password: `Qa#${unique}!`,
    title: 'Mr',
    birthDate: '10',
    birthMonth: 'May',
    birthYear: '1990',
    firstName: 'QA',
    lastName: 'HCX',
    company: 'HCXpert QA',
    address1: 'Rua dos Testes, 123',
    address2: 'Sala 4',
    country: 'India',
    zipcode: '550001',
    state: 'Estado de Teste',
    city: 'Cidade de Teste',
    mobileNumber: '11900001111',
    ...overrides,
  };
}

/** Converte o usuário para o payload form-encoded da API createAccount. */
export function toCreateAccountPayload(
  user: TestUser,
): Record<string, string> {
  return {
    name: user.name,
    email: user.email,
    password: user.password,
    title: user.title,
    birth_date: user.birthDate,
    birth_month: user.birthMonth,
    birth_year: user.birthYear,
    firstname: user.firstName,
    lastname: user.lastName,
    company: user.company,
    address1: user.address1,
    address2: user.address2,
    country: user.country,
    zipcode: user.zipcode,
    state: user.state,
    city: user.city,
    mobile_number: user.mobileNumber,
  };
}
