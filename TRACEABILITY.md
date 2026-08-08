# Matriz de Rastreabilidade — Desafio HCXpert QA/SDET

Vínculo entre requisito, cenário BDD, automação, evidência e resultado.
Os resultados abaixo referem-se à última execução local documentada no README
(artefatos completos em `cypress/evidencias/<execucao>/`).

Legenda de status: ✅ aprovado · ❌ falho · ⚠️ bloqueio de ambiente · 🐞 defeito conhecido (produto)

## WEB-01 — Login

| Cenário | Objetivo | Automação | Evidência | Status |
|---|---|---|---|---|
| WEB01-CT01 | Credenciais válidas permitem acesso | `web/autenticacao.feature` → `autenticacao.steps.ts` + `login.page.ts`, `header.component.ts`, hook `@provisioned-user` | vídeo + relatório HTML | ✅ |
| WEB01-CT02 | Credenciais inválidas não autenticam; mensagem verificável; sem sessão | idem | vídeo + relatório HTML | ✅ |
| WEB01-CT03 | Logout encerra sessão e devolve opção de acesso | idem + hook `@authenticated` (cy.session) | vídeo + relatório HTML | ✅ |

## WEB-02 — Busca

| Cenário | Objetivo | Automação | Evidência | Status |
|---|---|---|---|---|
| WEB02-CT01 | Resultado correspondente é exibido | `web/busca.feature` → `busca.steps.ts` + `products.page.ts`, fixture `busca.json` | vídeo + relatório HTML | ✅ |
| WEB02-CT02 | Busca sem correspondência comunica o estado | idem | vídeo + relatório HTML | ✅ |
| WEB02-CT03 | Fronteira: entrada vazia → catálogo completo | idem (massa capturada ao vivo) | vídeo + relatório HTML | ✅ |
| WEB02-CT04 | Fronteira: normalização de espaços | idem; suíte `@known-issue` separada | screenshot + triagem classificada | 🐞 falha de produto documentada |

## WEB-03 — Carrinho

| Cenário | Objetivo | Automação | Evidência | Status |
|---|---|---|---|---|
| WEB03-CT01 | Consistência produto/preço/qtd/subtotal listagem → carrinho | `web/carrinho.feature` → `carrinho.steps.ts` + `products.page.ts`, `cart.page.ts`, `cart-modal.component.ts` | vídeo + relatório HTML | ✅ |
| WEB03-CT02 | Quantidade no detalhe reflete no subtotal (preço × qtd) | idem + `product-detail.page.ts` | vídeo + relatório HTML | ✅ |
| WEB03-CT03 | Inclusão duplicada: comportamento documentado (1 linha, qtd 1) | idem | vídeo + relatório HTML | ✅ |

## WEB-04 — Checkout

| Cenário | Objetivo | Automação | Evidência | Status |
|---|---|---|---|---|
| WEB04-CT01 | Revisar endereço/itens e concluir pedido com pagamento fictício | `web/checkout.feature` → `checkout.steps.ts` + `checkout.page.ts`, `payment.page.ts`, `payment.factory.ts` | vídeo + relatório HTML | ✅ |

Limite declarado: pagamento simulado, sem gateway real; validado apenas o comportamento observável.

## WEB-05 — Validação

| Cenário | Objetivo | Automação | Evidência | Status |
|---|---|---|---|---|
| WEB05-CT01 | Cadastro com e-mail existente é rejeitado com mensagem | `web/validacao.feature` → `validacao.steps.ts` + `signup-form.component.ts` | vídeo + relatório HTML | ✅ |
| WEB05-CT02 | Login vazio bloqueado; mensagem associada ao campo (não cor) | idem + `login.page.ts` (Validity API) | vídeo + relatório HTML | ✅ |
| WEB05-CT03 | Pagamento sem nome no cartão bloqueado; mensagem no campo | idem + `payment.page.ts` (Validity API) | vídeo + relatório HTML | ✅ |

## API-01 — GET Trello

| Cenário | Objetivo | Automação | Evidência | Status |
|---|---|---|---|---|
| API01-CT01 | Sem credenciais: recusa (400) sem expor dados | `api/trello.feature` → `trello.steps.ts` + `trello.client.ts` | relatório HTML | ✅ |
| API01-CT02 | Credenciais inválidas: 401 | idem | relatório HTML | ✅ |
| API01-CT03 | Autenticado: 200, contrato, `list.name`, evidência sanitizada | idem + `schemas/trello-list.schema.json` | JSON sanitizado em `evidencias/api/` | ⚠️ bloqueado sem credenciais (suíte `@trello-auth`, modo controlado) |

## API-02 — POST Automation Exercise (createAccount)

| Cenário | Objetivo | Automação | Evidência | Status |
|---|---|---|---|---|
| API02-CT01 | Sucesso com dados únicos: status + contrato + regra (201); limpeza | `api/conta-automation-exercise.feature` → `conta.steps.ts` + `automation-exercise.client.ts`, `user.factory.ts` | relatório HTML | ✅ |
| API02-CT02 | Parâmetros ausentes (email/name/password): responseCode 400 + mensagem | idem (Scenario Outline, 3 exemplos) | relatório HTML | ✅ |
| API02-CT03 | E-mail duplicado: responseCode 400 "Email already exists!" | idem | relatório HTML | ✅ |

## Cobertura por critério de aceite

| Requisito | Positivo | Negativo | Fronteira |
|---|---|---|---|
| WEB-01 | CT01, CT03 | CT02 | — |
| WEB-02 | CT01 | CT02 | CT03 (vazia), CT04 (espaços) |
| WEB-03 | CT01, CT02 | CT03 (duplicidade) | CT02 (qtd > 1) |
| WEB-04 | CT01 | (pagamento inválido em WEB05-CT03) | — |
| WEB-05 | — | CT01, CT02, CT03 | — |
| API-01 | CT03 | CT01, CT02 | — |
| API-02 | CT01 | CT02 (×3), CT03 | CT02 (parâmetro a parâmetro) |
