# Desafio Técnico QA/SDET — HCXpert

Automação de testes web e API sobre o [Automation Exercise](https://automationexercise.com),
com integração à API do Trello, usando **Cypress 13 + TypeScript + Cucumber**
(Gherkin declarativo via `@badeball/cypress-cucumber-preprocessor`).

Este repositório é uma pequena entrega de engenharia de qualidade: estratégia
verificável, hipóteses explícitas, automação sustentável, evidências
reproduzíveis e execução segura em CI.

---

## 1. Pré-requisitos

- Node.js >= 18 (desenvolvido e validado com Node 20)
- npm >= 9
- Acesso de rede a `https://automationexercise.com` e `https://api.trello.com`
- (Opcional) Credenciais Trello para a suíte autenticada `@trello-auth`

## 2. Instalação limpa

```bash
npm ci
```

Instalação reproduzível a partir do `package-lock.json` versionado.

## 3. Configuração de ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário:

```bash
cp .env.example .env
```

| Variável | Obrigatória | Finalidade |
|---|---|---|
| `BASE_URL` | não (tem default) | URL base do sistema sob teste |
| `AE_API_URL` | não (tem default) | URL base da API do Automation Exercise |
| `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` | não | usuário pré-existente; **se ausentes, a suíte provisiona um usuário único via API e o remove no teardown** |
| `DEFAULT_TIMEOUT` / `PAGE_LOAD_TIMEOUT` / `API_TIMEOUT` | não | timeouts em ms |
| `TRELLO_API_BASE` | não (tem default) | endpoint configurável da API Trello |
| `TRELLO_LIST_ID` | só p/ `@trello-auth` | lista consultada no cenário autenticado |
| `TRELLO_API_KEY` / `TRELLO_API_TOKEN` | só p/ `@trello-auth` | credenciais da API Trello |

**Segredos nunca são versionados**: `.env` está no `.gitignore`; o CI usa
`secrets`/`vars` do GitHub. Evidências de API são sanitizadas antes de gravar
(`cypress/support/utils/sanitize.ts` mascara key/token/password/authorization).

## 4. Execução

| Comando | Finalidade |
|---|---|
| `npm run lint` | Análise estática (ESLint + typescript-eslint + regras Cypress) |
| `npm run test:smoke` | Sanidade rápida (`@smoke`: login válido, busca, carrinho, APIs) |
| `npm run test:e2e` | Suíte web completa headless (`@web`, sem `@known-issue`) |
| `npm run test:api` | Suíte de serviços (`@api`, sem `@trello-auth`) |
| `npm run test:api:trello` | Cenário Trello autenticado (exige credenciais no ambiente) |
| `npm run test:known-issues` | Defeitos conhecidos de produto (informativo, falha esperada) |
| `npm run test:all` | Tudo, exceto `@trello-auth` |
| `npm run test:open` | Cypress em modo interativo |
| `npm run report` | Consolida relatório HTML + triagem + evidências por execução |

Todas as suítes rodam headless por padrão (`cypress run`).

## 5. Relatórios, evidências e triagem

Cada execução gera `cypress/reports/cucumber-report.json`, screenshots de
falhas e vídeos por spec. `npm run report` consolida em
`cypress/evidencias/<timestamp>_<commit>/`:

- `relatorio-html/index.html` — relatório Cucumber com metadados da execução;
- `relatorio-triagem.md` + `falhas-classificadas.json` — **classificação de
  cada falha**: falha de produto, falha de teste, falha de dados ou
  indisponibilidade de ambiente (registro em `scripts/known-issues.mjs`);
- `screenshots/`, `videos/`, `api/` (request/response sanitizados).

Campos da evidência seguem o exigido pelo desafio: identificação (ID do
cenário/requisito, execução, commit), contexto (ambiente, browser, data/hora),
reprodução (passo com falha), resultado (esperado vs obtido + classificação),
artefatos e ação recomendada com responsável sugerido.

## 6. Estrutura

```
cypress/e2e/features/           Gherkin declarativo (web/ e api/)
cypress/e2e/step_definitions/   Steps que orquestram o fluxo (sem seletores)
cypress/support/page_objects/   Interação e seletores encapsulados
cypress/support/commands/       Comandos pequenos e coesos (login/sessão)
cypress/support/factories/      Dados únicos por execução (nunca dados reais)
cypress/support/api/            Camada de API separada da camada visual
cypress/support/utils/          Sanitização de segredos e evidências
cypress/fixtures/               Dados estáticos não sensíveis
cypress/schemas/                Contratos JSON Schema (AJV)
cypress/evidencias/             Artefatos consolidados por execução
scripts/                        Relatório, triagem e registro de defeitos
.github/workflows/ci.yml        Pipeline de qualidade contínua
```

Decisão arquitetural: a referência do desafio foi seguida quase à risca; a
única adaptação foi separar `features/` e `step_definitions/` em `web/` e
`api/` e criar `support/api/` + `support/utils/`, reforçando a exigência de
camada de API desacoplada da camada visual.

## 7. Hipóteses, observações e limitações (exigência do desafio)

### Observado diretamente (validado em execução real)

- **API createAccount responde HTTP 200 inclusive em erro de negócio**; o
  resultado real é o campo `responseCode` do corpo (201/400). Expectativa de
  status declarada por cenário nas features (quirk documentado).
- **Busca não normaliza espaços**: `"  dress  "` retorna 0 produtos e
  `"dress"` retorna 9 → registrado como **defeito de produto** (`@known-issue`
  WEB02-CT04), executado em suíte informativa não bloqueante.
- **Busca vazia não navega**: o catálogo completo permanece exibido
  (WEB02-CT03 documenta o comportamento observado).
- **Inclusão duplicada soma a quantidade** (1 → 2) mantendo uma única linha
  no carrinho, com subtotal consistente (WEB03-CT03).
- **Cadastro com e-mail existente** mantém o visitante em `/signup` com a
  mensagem "Email Address already exist!" (WEB05-CT01).
- **Trello sem credenciais**: id malformado → 400; id inexistente → 404;
  nunca 200 com dados. Credenciais inválidas → 401 "invalid key".
  Justificativa de múltiplos status documentada na feature `api/trello.feature`.
- Validações de obrigatoriedade usam a **Validity API do HTML5**
  (`validity.valueMissing` + `validationMessage`): mensagem associada ao
  campo, sem depender de cor.

### Inferido (declarado, não confirmado)

- A correspondência da busca considera também descrição/categoria do produto:
  a busca por "dress" retorna itens cujo **nome** não contém o termo
  (ex.: "Sleeves Top and Short - Blue & Pink"). O critério exato de
  relevância não é verificável pela listagem; o cenário valida o invariante
  observável (há resultados, ao menos um nome contém o termo, cards íntegros).

### Não validado (limitação do ambiente)

- **API do Automation Exercise a partir de runners hospedados (GitHub
  Actions)**: o Cloudflare do site público responde **403 anti-bot** para
  chamadas `/api/*` vindas de IP de datacenter (a navegação web normal
  passa — a suíte E2E fica verde na CI). Tratamento: pré-checagem de
  acessibilidade (`scripts/check-api-reachability.mjs`) + modo controlado na
  CI — API-02 bloqueada fica **ausente do relatório** (nunca verde por
  omissão), com evidência do probe publicada e classificação
  `indisponibilidade de ambiente`. A suíte completa de API é validada em
  rede permitida (local/`act`) e seus artefatos estão nesta entrega.
- **Pagamento real**: o checkout usa formulário simulado, sem gateway. Usamos
  PAN de teste público (`4111...`) e validamos apenas o comportamento
  observável (validação de campos e confirmação do pedido).
- **API01-CT03 (Trello autenticado)** não foi executado neste ambiente por
  exigir credenciais reais do avaliador; a suíte `@trello-auth` e o modo de
  execução controlado estão prontos (ver seção 8).
- Comportamento do carrinho entre sessões/abas e concorrência de estoque:
  fora do que o ambiente público permite verificar.

## 8. Modo de execução controlado — Trello autenticado

Sem credenciais, `API01-CT03` falha explicitamente com a mensagem
`[BLOQUEIO DE AMBIENTE]...` (classificado na triagem como indisponibilidade
de ambiente) — nunca é mascarado nem roda nas suítes padrão. Para executá-lo:

```bash
# .env: TRELLO_API_KEY=... TRELLO_API_TOKEN=... TRELLO_LIST_ID=...
npm run test:api:trello
```

O cenário confirma a **estrutura** da lista (JSON Schema) **antes** de validar
`list.name`, e registra a resposta **sanitizada** em `cypress/evidencias/`.

## 9. Política de retries e flakiness

Retries **apenas em CI** (`CI=true`), limitados a **1 tentativa extra** em
run mode; localmente são zero. Retry não substitui correção: uma falha que
passa no retry continua registrada no relatório JSON e deve ser tratada como
sinal de instabilidade na triagem. Não usamos esperas fixas: a sincronização
é por estado observável (elemento, URL, modal, título de seção).

**Instabilidade observada:** em 5 execuções locais da suíte smoke, houve 1
falha transitória não reproduzida nas 3 reexecuções seguintes (a evidência foi
sobrescrita pela reexecução automática da mesma suíte — lição registrada:
preservar artefatos por execução, o que `npm run report` já faz ao versionar
por timestamp). Tratada como provável oscilação do ambiente público; a
política acima garante que recorrência aparecerá na triagem, não escondida.

## 10. CI/CD

`.github/workflows/ci.yml`:

1. **lint** → 2. **smoke** (gate rápido) → 3. **e2e** e **api** (obrigatórias;
   o job falha se um teste obrigatório falhar) → **trello-auth** (só quando
   `vars.TRELLO_CONFIGURED == 'true'` — pulado explicitamente, nunca "verde
   por omissão") e **known-issues** (informativo, `continue-on-error`, gera
   evidência atualizada dos defeitos de produto registrados).
- Cache de dependências via `actions/setup-node` + `cypress-io/github-action`;
- Artefatos publicados em todos os jobs de teste, mesmo em falha
  (`if: always()`), incluindo relatório HTML e triagem.

### Executar a CI localmente (act + Docker)

O workflow pode ser executado de ponta a ponta antes do push, com
[act](https://github.com/nektos/act) e Docker. Foi assim que esta entrega foi
validada (imagem local com as dependências do Cypress):

```bash
# imagem local: ghcr.io/catthehacker/ubuntu:act-22.04 + xvfb/libgtk (ver /tmp/act-img/Dockerfile)
docker build -t act-cypress:22.04 /tmp/act-img
act push -P ubuntu-latest=act-cypress:22.04 --pull=false --bind=false \
  --container-options "--network=bridge" \
  --artifact-server-path /tmp/act-artifacts
```

Notas de fidelidade do runner local: `--network=bridge` isola o Xvfb de jobs
paralelos (com `network=host` eles colidem no socket X — limitação do act,
não do workflow); artefatos ficam em `/tmp/act-artifacts`; no GitHub hospedado
cada job já recebe uma VM isolada e o `continue-on-error` do job informativo
mantém a conclusão da run como sucesso (o act encerra com exit 1 — diferença
conhecida de fidelidade).

## 11. Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| `cypress run` falha ao iniciar o browser | Dependências de sistema do Electron ausentes (Linux headless) | Instalar libs (`libgtk-3`, `xvfb`...) ou usar imagem `cypress/included` |
| Cenários `@provisioned-user` falham no hook | API de apoio indisponível ou instável | Checar `AE_API_URL` e conectividade; a triagem classifica como falha de dados/ambiente |
| `test:api:trello` falha com `BLOQUEIO DE AMBIENTE` | Credenciais Trello não configuradas | Preencher `.env` (seção 3) — comportamento esperado sem configuração |
| Busca por produto retorna 0 resultados | Catálogo do ambiente mudou | Atualizar `cypress/fixtures/busca.json` (massa controlada) |
| Relatório não gerado | Suíte não executou antes do `npm run report` | Executar uma suíte primeiro; o script avisa se o JSON não existe |

## 12. Documentos relacionados

- [`TRACEABILITY.md`](./TRACEABILITY.md) — matriz requisito ↔ cenário ↔
  automação ↔ evidência ↔ resultado;
- [`PARECER_CRITICO.md`](./PARECER_CRITICO.md) — parecer SDET sobre
  testabilidade, riscos residuais e próximos incrementos.
