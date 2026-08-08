import {
  Given,
  When,
  Then,
} from '@badeball/cypress-cucumber-preprocessor';
import { context } from '../../../support/context';
import { getConfig, requireTrelloCredentials } from '../../../support/env';
import {
  trelloGetList,
  trelloGetListWithoutCredentials,
  trelloGetListWithInvalidCredentials,
  type TrelloList,
} from '../../../support/api/trello.client';
import { assertSchema } from '../../../support/api/schema-validator';
import { buildEvidence, persistApiEvidence } from '../../../support/utils/evidence';
import trelloListSchema from '../../../schemas/trello-list.schema.json';

// API01-CT01/CT02 - contrato de erro 401 (executável sem segredos)

When('uma lista é consultada sem credenciais', () => {
  trelloGetListWithoutCredentials().then((response) => {
    context.lastApiResponse = response;
  });
});

When('uma lista é consultada com credenciais inválidas', () => {
  trelloGetListWithInvalidCredentials().then((response) => {
    context.lastApiResponse = response;
  });
});

Then('a API do Trello deve recusar a requisição', () => {
  // Expectativa declarada: sem credenciais e com identificador malformado,
  // o Trello responde 400 (ver justificativa na feature).
  expect(context.lastApiResponse!.status, 'HTTP status').to.eq(400);
});

Then('a resposta não deve expor dados de lista', () => {
  // Invariante de segurança: sem autenticação, nenhum campo do contrato
  // de lista pode ser retornado.
  const body = context.lastApiResponse!.body as Record<string, unknown>;
  expect(body, 'corpo sem dados de lista').to.not.have.all.keys(
    'id',
    'name',
    'idBoard',
  );
  expect(body.name, 'campo name ausente').to.eq(undefined);
});

Then('a API do Trello deve recusar a requisição como não autorizada', () => {
  // Expectativa declarada: credenciais inválidas -> 401 Unauthorized.
  expect(context.lastApiResponse!.status, 'HTTP status').to.eq(401);
});

// API01-CT03 - consulta autenticada (modo de execução controlado)

Given('que a integração Trello está configurada no ambiente', () => {
  // Falha explicitamente classificada como BLOQUEIO DE AMBIENTE quando as
  // credenciais não existem — nunca mascaramos a indisponibilidade.
  requireTrelloCredentials();
});

When('a lista configurada é consultada com credenciais válidas', () => {
  const { listId } = getConfig().trello;
  trelloGetList(listId).then((response) => {
    context.lastApiResponse = response;
  });
});

Then('a API do Trello deve confirmar o sucesso da consulta', () => {
  expect(context.lastApiResponse!.status, 'HTTP status').to.eq(200);
});

Then('a estrutura da lista deve seguir o contrato documentado', () => {
  // A estrutura é confirmada ANTES de qualquer validação de campo.
  assertSchema(trelloListSchema, context.lastApiResponse!.body, 'trello-list');
});

Then('o campo name da lista deve ser um texto não vazio', () => {
  const list = context.lastApiResponse!.body as TrelloList;
  expect(list.name, 'campo list.name').to.be.a('string');
  expect(list.name.trim(), 'campo list.name').to.not.eq('');
});

Then('a resposta sanitizada deve ser registrada como evidência', () => {
  const { trello } = getConfig();
  const { status, headers, body } = context.lastApiResponse!;
  persistApiEvidence(`trello-lista-${Date.now()}`, {
    ...buildEvidence(
      {
        method: 'GET',
        url: `${trello.apiBase}/lists/${trello.listId}`,
        // A sanitização mascara key/token antes de gravar (utils/sanitize).
        body: { key: trello.key, token: trello.token },
      },
      { status, headers, body },
    ),
  });
});
