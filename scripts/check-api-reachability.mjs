/**
 * Pré-checagem de acessibilidade da API pública do Automation Exercise.
 *
 * Por quê existe: o site público fica atrás de Cloudflare e bloqueia
 * chamadas à /api/* vindas de IPs de datacenter (observado na CI hospedada
 * do GitHub: HTTP 403/HTML de challenge). A suíte API-02 depende desse
 * endpoint; sem acesso, ela não pode executar de forma reproduzível.
 *
 * Este probe NUNCA falha o pipeline por si só: ele classifica o ambiente
 * (reachable=true/false via GITHUB_OUTPUT), registra evidência sanitizada
 * e deixa o workflow decidir o modo de execução (completo ou controlado).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { appendFileSync } from 'node:fs';

const apiUrl = process.env.AE_API_URL ?? 'https://automationexercise.com/api';

async function main() {
  const evidencia = {
    probe: 'POST /verifyLogin (credenciais inertes de sondagem)',
    url: `${apiUrl}/verifyLogin`,
    timestamp: new Date().toISOString(),
    status: null,
    contentType: null,
    corpoJson: null,
    reachable: false,
    motivo: '',
  };

  try {
    const body = new URLSearchParams({
      email: 'probe.inerte@example.com',
      password: 'probe-inerte',
    });
    // Uma tentativa extra contra falhas transitórias de rede antes de
    // classificar o ambiente como inacessível.
    let response;
    let ultimoErro;
    for (let tentativa = 0; tentativa < 2; tentativa += 1) {
      try {
        response = await fetch(evidencia.url, {
          method: 'POST',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
          signal: AbortSignal.timeout(15000),
        });
        ultimoErro = undefined;
        break;
      } catch (erro) {
        ultimoErro = erro;
      }
    }
    if (!response) {
      throw ultimoErro;
    }
    evidencia.status = response.status;
    evidencia.contentType = response.headers.get('content-type');
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      evidencia.corpoJson = true;
      // Comportamento documentado da API: 200 + responseCode no corpo
      // (404 "User not found!" para a sondagem inerte é RESPOSTA SAUDÁVEL).
      if (response.status === 200 && typeof parsed.responseCode === 'number') {
        evidencia.reachable = true;
        evidencia.motivo = 'API acessível e contrato íntegro.';
      } else {
        evidencia.motivo = `Resposta inesperada: status ${response.status} com corpo JSON fora do contrato.`;
      }
    } catch {
      evidencia.corpoJson = false;
      evidencia.motivo = `Bloqueio de ambiente: status ${response.status} com corpo não-JSON (anti-bot/Cloudflare). Trecho: ${text.slice(0, 120)}`;
    }
  } catch (erro) {
    evidencia.motivo = `Falha de rede na sondagem: ${erro.message}`;
  }

  mkdirSync('cypress/evidencias', { recursive: true });
  writeFileSync(
    'cypress/evidencias/probe-api.json',
    JSON.stringify(evidencia, null, 2),
  );

  console.log(
    `Probe API externa: reachable=${evidencia.reachable} — ${evidencia.motivo}`,
  );
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `reachable=${evidencia.reachable}\n`,
    );
  }
  // Exit 0 sempre: o probe classifica o ambiente; quem decide é o workflow.
}

main();
