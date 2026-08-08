import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { runTriage } from './triage.mjs';

/**
 * Consolidação de relatório e evidências por execução.
 *
 * Gera em cypress/evidencias/<timestamp>-<commit>/:
 *   - relatorio-html/        (multiple-cucumber-html-reporter)
 *   - relatorio-triagem.md   (falhas classificadas: produto/teste/dados/ambiente)
 *   - falhas-classificadas.json
 *   - cucumber-report.json   (fonte bruta)
 *   - screenshots/, videos/, api/ (evidências persistidas pelos testes)
 */

const require = createRequire(import.meta.url);
const reporter = require('multiple-cucumber-html-reporter');

const ROOT = new URL('..', import.meta.url).pathname;
const REPORTS_DIR = join(ROOT, 'cypress/reports');
const EVIDENCES_DIR = join(ROOT, 'cypress/evidencias');

function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT })
      .toString()
      .trim();
  } catch {
    return 'sem-git';
  }
}

function copyIfExists(from, to) {
  if (existsSync(from)) {
    cpSync(from, to, { recursive: true });
    return true;
  }
  return false;
}

function main() {
  const cucumberJson = join(REPORTS_DIR, 'cucumber-report.json');
  if (!existsSync(cucumberJson)) {
    console.error(
      `Relatório Cucumber não encontrado em ${cucumberJson}. ` +
        'Execute uma suíte antes (ex.: npm run test:e2e).',
    );
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const commit = gitCommit();
  const runId = `${timestamp}_${commit}`;
  const runDir = join(EVIDENCES_DIR, runId);
  mkdirSync(runDir, { recursive: true });

  // Evidências brutas da execução
  const stagingJsonDir = join(runDir, 'cucumber-json');
  mkdirSync(stagingJsonDir, { recursive: true });
  copyFileSync(cucumberJson, join(stagingJsonDir, 'cucumber-report.json'));
  if (existsSync(join(REPORTS_DIR, 'cucumber-messages.ndjson'))) {
    copyFileSync(
      join(REPORTS_DIR, 'cucumber-messages.ndjson'),
      join(runDir, 'cucumber-messages.ndjson'),
    );
  }
  copyIfExists(join(ROOT, 'cypress/screenshots'), join(runDir, 'screenshots'));
  copyIfExists(join(ROOT, 'cypress/videos'), join(runDir, 'videos'));

  // Evidências de API persistidas pelos testes (sanitizadas)
  const apiEvidence = readdirSync(EVIDENCES_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => e.name);
  if (apiEvidence.length > 0) {
    const apiDir = join(runDir, 'api');
    mkdirSync(apiDir, { recursive: true });
    for (const file of apiEvidence) {
      copyFileSync(join(EVIDENCES_DIR, file), join(apiDir, file));
    }
  }

  const contexto = {
    id: runId,
    commit,
    timestamp: new Date().toISOString(),
    baseUrl: process.env.BASE_URL ?? 'https://automationexercise.com',
    suite: process.env.TAGS ?? 'última execução',
  };

  // Triagem e classificação das falhas
  const triagem = runTriage({
    cucumberJsonPath: cucumberJson,
    outputDir: runDir,
    contexto,
  });

  // Relatório HTML interativo
  reporter.generate({
    jsonDir: stagingJsonDir,
    reportPath: join(runDir, 'relatorio-html'),
    pageTitle: 'Desafio HCX SDET - Relatório de Execução',
    reportName: 'Relatório de Execução - HCXpert QA/SDET',
    displayDuration: true,
    metadata: {
      browser: {
        name: process.env.BROWSER ?? 'electron',
        version: 'cypress run',
      },
      device: 'CI/local runner',
      platform: { name: process.platform, version: process.version },
    },
    customData: {
      title: 'Contexto da execução',
      data: [
        { label: 'Execução', value: runId },
        { label: 'Commit', value: commit },
        { label: 'Ambiente', value: contexto.baseUrl },
        { label: 'Suíte/tags', value: contexto.suite },
        {
          label: 'Falhas classificadas',
          value: String(triagem.resumo?.falhas ?? 0),
        },
      ],
    },
  });

  console.log(`Relatório consolidado em: ${runDir}`);
  console.log(`- HTML:    ${join(runDir, 'relatorio-html', 'index.html')}`);
  console.log(`- Triagem: ${join(runDir, 'relatorio-triagem.md')}`);
}

main();
