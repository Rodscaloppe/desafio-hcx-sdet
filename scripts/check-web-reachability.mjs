/**
 * Pré-checagem de acessibilidade do SITE (camada web) do Automation Exercise.
 *
 * Por quê existe: observado na CI hospedada do GitHub que, dependendo do IP
 * de saída do runner, o Cloudflare do site público responde com página de
 * challenge ("Just a moment...") que em navegador real vira loop de
 * redirects — inviabilizando QUALQUER teste web naquele runner. Nesses
 * cenários a suíte web não pode executar de forma reproduzível.
 *
 * Como o probe de API, este script nunca falha o pipeline: classifica o
 * ambiente (reachable=true/false), registra evidência e deixa o workflow
 * decidir o modo de execução.
 */
import { writeFileSync, appendFileSync, mkdirSync } from 'node:fs';

const baseUrl = process.env.BASE_URL ?? 'https://automationexercise.com';

const MARCADOR_PRODUTO = 'Automation Exercise';
const MARCADORES_CHALLENGE = ['just a moment', 'cf-chl', 'challenge-platform'];

async function main() {
  const evidencia = {
    probe: `GET ${baseUrl}/ (home)`,
    timestamp: new Date().toISOString(),
    status: null,
    conteudoProduto: null,
    challengeDetectado: null,
    reachable: false,
    motivo: '',
  };

  try {
    let response;
    let ultimoErro;
    for (let tentativa = 0; tentativa < 2; tentativa += 1) {
      try {
        response = await fetch(`${baseUrl}/`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(15000),
          redirect: 'follow',
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

    const html = (await response.text()).toLowerCase();
    evidencia.status = response.status;
    evidencia.conteudoProduto = html.includes(MARCADOR_PRODUTO.toLowerCase());
    evidencia.challengeDetectado = MARCADORES_CHALLENGE.some((m) =>
      html.includes(m),
    );

    if (
      response.status === 200 &&
      evidencia.conteudoProduto &&
      !evidencia.challengeDetectado
    ) {
      evidencia.reachable = true;
      evidencia.motivo = 'Site acessível e servindo conteúdo de produto.';
    } else {
      evidencia.motivo =
        `Bloqueio de ambiente: status ${response.status}, ` +
        `conteúdo de produto=${evidencia.conteudoProduto}, ` +
        `challenge anti-bot=${evidencia.challengeDetectado}.`;
    }
  } catch (erro) {
    evidencia.motivo = `Falha de rede na sondagem: ${erro.message}`;
  }

  mkdirSync('cypress/evidencias', { recursive: true });
  writeFileSync(
    'cypress/evidencias/probe-web.json',
    JSON.stringify(evidencia, null, 2),
  );

  console.log(
    `Probe site: reachable=${evidencia.reachable} — ${evidencia.motivo}`,
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
