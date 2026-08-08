import type { TestUser } from './factories/user.factory';

/**
 * Contexto compartilhado entre os steps DE UM MESMO cenário.
 *
 * O preprocessador Cucumber do Cypress não fornece um "World" como o
 * cucumber-js; este módulo cumpre esse papel. O estado é reiniciado no hook
 * Before de cada cenário (ver step_definitions/common/hooks.ts), garantindo
 * isolamento e independência de ordem de execução.
 */
export interface CartExpectation {
  productId: string;
  name: string;
  price: string;
  quantity: number;
}

/** Observação genérica de uma resposta de API (AE ou Trello). */
export interface ApiObservation {
  status: number;
  headers: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

class ScenarioContext {
  /** Usuário autenticado no cenário (provisionado pela suíte ou vindo do env). */
  currentUser?: TestUser;

  /** true quando a suíte criou o usuário via API e deve removê-lo no teardown. */
  provisionedBySuite = false;

  /** Payload bruto preparado para chamadas de API (ex.: parâmetro removido). */
  apiPayload?: Record<string, string>;

  /** Última resposta de API observada, para encadeamento de asserts. */
  lastApiResponse?: ApiObservation;

  /** Termo de busca utilizado no cenário. */
  searchTerm?: string;

  /** Quantidade de produtos do catálogo completo, capturada na listagem. */
  catalogCount?: number;

  /** Dados capturados na listagem/detalhe para checar consistência no carrinho. */
  cartExpectation?: CartExpectation;

  reset(): void {
    this.currentUser = undefined;
    this.provisionedBySuite = false;
    this.apiPayload = undefined;
    this.lastApiResponse = undefined;
    this.searchTerm = undefined;
    this.catalogCount = undefined;
    this.cartExpectation = undefined;
  }
}

export const context = new ScenarioContext();
