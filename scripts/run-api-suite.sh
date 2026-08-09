#!/usr/bin/env bash
# Seleciona o modo de execução da suíte de API conforme a sondagem de
# acessibilidade (scripts/check-api-reachability.mjs):
#   reachable=true  -> suíte completa (API-01 contratos + API-02 conta)
#   reachable=false -> apenas contratos independentes do site (API-01), com
#                      aviso explícito de que API-02 ficou bloqueada por
#                      ambiente (evidência em cypress/evidencias/probe-api.json)
set -euo pipefail

# Normaliza o argumento (alguns executores repassam aspas literais).
REACHABLE="${1:-true}"
REACHABLE="${REACHABLE//\"/}"
REACHABLE="${REACHABLE//\'/}"

if [ "$REACHABLE" = "true" ]; then
  echo "Ambiente acessível: executando suíte de API completa."
  npm run test:api
else
  echo "::warning::API pública do Automation Exercise INACESSÍVEL deste runner (bloqueio anti-bot de datacenter). API-02 não executada neste ambiente — evidência e classificação nos artefatos; suíte completa validada localmente/via act."
  npm run test:api:contratos
fi
