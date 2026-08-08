import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  KNOWN_ISSUES,
  CLASSIFICATION_RULES,
  DEFAULT_CLASSIFICATION,
} from './known-issues.mjs';

/**
 * Triagem de falhas: classifica cada cenário falho como
 *   falha de produto | falha de teste | falha de dados | indisponibilidade de ambiente
 *
 * Entradas: cypress/reports/cucumber-report.json (gerado pela execução).
 * Saídas:  falhas-classificadas.json e relatorio-triagem.md no diretório
 *          de evidências da execução.
 */

function extractScenarioId(name, tags) {
  const fromTag = (tags ?? [])
    .map((t) => t.name.replace(/^@/, ''))
    .find((t) => /^[A-Z]+\d{2}-CT\d{2}$/.test(t));
  if (fromTag) return fromTag;
  const fromName = name.match(/([A-Z]+\d{2}-CT\d{2})/);
  return fromName ? fromName[1] : 'sem-id';
}

function classify(scenarioId, errorMessage) {
  if (KNOWN_ISSUES[scenarioId]) {
    return { ...KNOWN_ISSUES[scenarioId], origem: 'registro de defeitos conhecidos' };
  }
  const message = errorMessage ?? '';
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.padrao.test(message)) {
      return { ...rule, origem: 'heurística automática' };
    }
  }
  return { ...DEFAULT_CLASSIFICATION, origem: 'não classificado' };
}

function scenarioError(element) {
  const steps = element.steps ?? [];
  const failed = steps.find((s) => s.result?.status === 'failed');
  if (!failed) return { passo: '(não identificado)', erro: '' };
  return {
    passo: `${failed.keyword ?? ''}${failed.name ?? ''}`.trim(),
    erro: (failed.result.error_message ?? '').split('\n').slice(0, 12).join('\n'),
  };
}

export function runTriage({ cucumberJsonPath, outputDir, contexto }) {
  if (!existsSync(cucumberJsonPath)) {
    return { total: 0, falhas: [], aviso: `relatório não encontrado: ${cucumberJsonPath}` };
  }
  const features = JSON.parse(readFileSync(cucumberJsonPath, 'utf8'));
  const falhas = [];
  let total = 0;

  for (const feature of features) {
    for (const element of feature.elements ?? []) {
      if (element.type !== 'scenario') continue;
      total += 1;
      const status = (element.steps ?? []).every(
        (s) => s.result?.status === 'passed',
      )
        ? 'passed'
        : 'failed';
      if (status === 'passed') continue;

      const id = extractScenarioId(element.name, element.tags);
      const { passo, erro } = scenarioError(element);
      falhas.push({
        id,
        requisito: (element.tags ?? [])
          .map((t) => t.name.replace(/^@/, ''))
          .find((t) => /^(WEB|API)-\d{2}$/.test(t)) ?? 'n/d',
        feature: feature.name,
        cenario: element.name,
        passoComFalha: passo,
        erroResumido: erro,
        ...classify(id, `${passo}\n${erro}`),
      });
    }
  }

  const relatorio = {
    execucao: contexto,
    resumo: {
      cenariosExecutados: total,
      falhas: falhas.length,
      porClassificacao: falhas.reduce((acc, f) => {
        acc[f.classificacao] = (acc[f.classificacao] ?? 0) + 1;
        return acc;
      }, {}),
    },
    falhas,
  };

  writeFileSync(
    join(outputDir, 'falhas-classificadas.json'),
    JSON.stringify(relatorio, null, 2),
  );
  writeFileSync(join(outputDir, 'relatorio-triagem.md'), toMarkdown(relatorio));
  return relatorio;
}

function toMarkdown(relatorio) {
  const { execucao, resumo, falhas } = relatorio;
  const linhas = [
    '# Relatório de Triagem de Falhas',
    '',
    `- **Execução:** ${execucao.id}`,
    `- **Commit:** ${execucao.commit}`,
    `- **Data/hora:** ${execucao.timestamp}`,
    `- **Ambiente:** ${execucao.baseUrl}`,
    `- **Suíte/tags:** ${execucao.suite}`,
    '',
    `## Resumo`,
    '',
    `- Cenários executados: ${resumo.cenariosExecutados}`,
    `- Falhas: ${resumo.falhas}`,
    ...Object.entries(resumo.porClassificacao).map(
      ([classe, qtd]) => `- ${classe}: ${qtd}`,
    ),
    '',
  ];
  if (falhas.length === 0) {
    linhas.push('Nenhuma falha nesta execução.', '');
    return linhas.join('\n');
  }
  linhas.push('## Falhas classificadas', '');
  for (const f of falhas) {
    linhas.push(
      `### ${f.id} — ${f.cenario}`,
      '',
      `- **Requisito:** ${f.requisito}`,
      `- **Feature:** ${f.feature}`,
      `- **Classificação:** ${f.classificacao} (${f.origem})`,
      `- **Severidade:** ${f.severidade}`,
      `- **Passo com falha:** \`${f.passoComFalha}\``,
      `- **Hipótese de causa:** ${f.hipotese}`,
      `- **Recomendação:** ${f.recomendacao}`,
      `- **Responsável sugerido:** ${f.responsavelSugerido}`,
      '',
      '```',
      f.erroResumido,
      '```',
      '',
    );
  }
  return linhas.join('\n');
}

// Execução standalone: node scripts/triage.mjs <cucumber.json> <dir-saida>
if (process.argv[1]?.endsWith('triage.mjs')) {
  const [jsonPath, outputDir] = process.argv.slice(2);
  const resultado = runTriage({
    cucumberJsonPath: jsonPath ?? 'cypress/reports/cucumber-report.json',
    outputDir: outputDir ?? 'cypress/evidencias',
    contexto: {
      id: 'manual',
      commit: 'n/d',
      timestamp: new Date().toISOString(),
      baseUrl: process.env.BASE_URL ?? 'n/d',
      suite: process.env.TAGS ?? 'n/d',
    },
  });
  console.log(
    `Triagem concluída: ${resultado.resumo?.falhas ?? 0} falha(s) classificada(s).`,
  );
  console.log('Artefatos em evidências:', readdirSync(outputDir ?? 'cypress/evidencias').join(', '));
}
