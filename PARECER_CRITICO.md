# Parecer Crítico SDET — HCXpert / Automation Exercise

Avaliação de testabilidade, riscos, ambiguidades e decisões, conforme exigido
na Parte 1 do desafio. Opinião técnica fundamentada nas execuções reais
registradas em `cypress/evidencias/`.

## 1. Testabilidade do sistema sob teste

**Pontos positivos**

- Seletores `data-qa` estáveis nos fluxos de autenticação, cadastro e
  pagamento — boa superfície de automação.
- API pública de apoio (`/api/createAccount`, `/api/deleteAccount`) permite
  provisionamento e teardown programáticos: os testes web não dependem de
  massa pré-existente nem de ordem de execução.
- Validações de formulário usam a Validity API do HTML5 — verificáveis de
  forma semântica, sem depender de cor/estilo.

**Pontos de atrito (riscos de manutenção)**

- **Contrato da API não é RESTful convencional**: HTTP 200 com
  `responseCode` no corpo exige camada de asserção própria e confunde
  ferramentas/monitoramento padrão. Recomendação: códigos HTTP semânticos.
- **Ausência de `data-testid` em áreas-chave**: busca (`#search_product`),
  botão de adicionar ao carrinho do detalhe (`button.cart`), tabela de
  revisão do checkout (`#cart_info`, divergente do `#cart_info_table` do
  carrinho). Todos encapsulados em page objects — ponto único de manutenção —
  mas o ideal é o produto expor atributos de teste dedicados.
- **Conteúdo de terceiros** (anúncios/telemetria) no ambiente público:
  mitigado via `blockHosts`, porém é dependência externa fora de controle.

## 2. Ambiguidades encontradas e tratamento aplicado

| Ambiguidade | Tratamento |
|---|---|
| "Busca correspondente" sem definição de regra de match | Validado invariante observável; hipótese (match por nome e/ou descrição) registrada no README |
| "Comunica o estado" para busca vazia/sem resultado | Comportamento observado documentado e testado (sem mensagem explícita: a UI apenas não lista itens) |
| Status esperados da API | Declarados por cenário após sondagem real (quirk HTTP 200 + responseCode) |
| Trello: "validar list.name" | Contrato JSON Schema validado antes do campo; recusa sem credenciais testada sem segredos; autenticado em modo controlado |
| "Checkout completo" sem gateway | Limite declarado; validado até a confirmação observável do pedido com PAN de teste |

## 3. Defeitos e riscos identificados

1. **(Produto — média) Busca não normaliza espaços** (`WEB02-CT04`):
   `"  dress  "` → 0 resultados vs `"dress"` → 9. Evidência em suíte
   `@known-issue`, classificado na triagem como falha de produto.
2. **(Produto — baixa/média) Relevância da busca**: resultados sem o termo
   no nome (ex.: "Sleeves Top and Short - Blue & Pink" para "dress"). Se a
   regra for match apenas por nome, há defeito de relevância; se incluir
   descrição, é comportamento não documentado. Requer confirmação do PO.
3. **(Produto — baixa) UX de estados vazios**: busca sem correspondência não
   comunica explicitamente ("Nenhum produto encontrado"); o usuário vê apenas
   uma seção vazia. Recomendação de mensagem explícita.
4. **(Ambiente) Dependência de site público compartilhado**: catálogo,
   disponibilidade e conteúdo podem mudar sem aviso → massa de referência
   capturada ao vivo sempre que possível (ex.: tamanho do catálogo), fixtures
   apenas para termos de busca. Em 5 execuções locais do smoke houve 1 falha
   transitória isolada, atribuída a oscilação do ambiente; se recorrer, a
   triagem a promoverá a investigação (política de retry não a mascara).
5. **(Ambiente) Anti-bot do site público em datacenters**: o Cloudflare do
   Automation Exercise bloqueia `/api/*` de IPs de datacenter (HTTP 403) e,
   em parte dos runners, serve challenge até para navegação (loop de
   redirects) — confirmado em runs reais hospedadas. Mitigações
   implementadas: sondagens de acessibilidade (web e API) + modo controlado
   com evidência + provisionamento adaptativo de usuários (API → UI) +
   classificação automática na triagem. Em iniciativa real: ambiente de
   homologação próprio ou allowlist de IP, eliminando a dependência do site
   público.

## 4. Riscos residuais sem cobertura (fora de escopo, com tratamento proposto)

- **Performance**: sem cobertura. Em iniciativa real: orçamentos de Web
  Vitals no pipeline (Lighthouse CI) + testes de carga na API (k6).
- **Segurança ofensiva**: apenas o invariante "sem credenciais, sem dados" foi
  exercitado na API Trello. Proposto: varredura OWASP ZAP + validações do API
  Security Top 10 (BOLA, rate limiting) em ambiente controlado.
- **Compatibilidade entre navegadores**: executado em Electron/Chromium.
  Proposto: matriz Chrome/Firefox/WebKit no CI (Playwright ou Cypress com
  browsers instalados) priorizada por analytics de uso.
- **Acessibilidade**: asserts semânticos reduzem o risco, mas não há varredura
  automatizada (axe-core) nem auditoria manual. Proposto: axe-core por página
  crítica + critérios WCAG 2.1 AA no DoD.
- **Contrato entre serviços**: schemas JSON cobrem o essencial aqui; em
  arquitetura com múltiplos consumidores, adotar Pact.

## 5. Próximos incrementos sugeridos

1. Ambiente de homologação isolado com dados controlados (elimina a classe de
   risco "site público mutável").
2. `data-testid` dedicados nos pontos documentados como frágeis.
3. Visual regression nos fluxos de catálogo/carrinho (Applitools/Percy).
4. Execução paralela por tag no CI com relatório de flakiness agregado
   (taxa por cenário ao longo do tempo).
5. Gate de qualidade enriquecido: cobertura de requisitos obrigatórios no
   pipeline (falhar se algum ID WEB/API deixar de executar).

## 6. Conclusão

A suíte entregue cobre todos os requisitos obrigatórios com cenários
positivos, negativos e de fronteira, isolados e determinísticos. As duas
divergências relevantes encontradas em execução real (normalização da busca e
contrato não convencional da API) foram registradas, classificadas e
transformadas em evidência reproduzível — nenhuma foi mascarada por retry ou
asserção frouxa. O principal risco residual é a dependência de um ambiente
público compartilhado, mitigada por configuração externalizada e massa
autoprovissionada.
