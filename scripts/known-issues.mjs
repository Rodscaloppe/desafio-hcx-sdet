/**
 * Registro de defeitos conhecidos e classificações pré-definidas.
 *
 * Nada aqui MASCARA falhas: os cenários listados continuam executando e
 * falhando na suíte própria (@known-issue). O registro apenas garante que,
 * quando falharem, sejam classificados de forma consistente na triagem.
 */
export const KNOWN_ISSUES = {
  'WEB02-CT04': {
    classificacao: 'falha de produto',
    severidade: 'média',
    hipotese:
      'A busca não normaliza espaços nas extremidades do termo; "  dress  " retorna 0 resultados enquanto "dress" retorna 9.',
    recomendacao:
      'Aplicar trim/normalização do termo no backend ou na camada de apresentação antes da consulta.',
    responsavelSugerido: 'time de produto/backend',
  },
};

/**
 * Heurísticas de classificação automática aplicadas quando o cenário não
 * consta no registro de defeitos conhecidos. Ordenadas da mais específica
 * para a mais genérica.
 */
export const CLASSIFICATION_RULES = [
  {
    padrao: /BLOQUEIO DE AMBIENTE/i,
    classificacao: 'indisponibilidade de ambiente',
    severidade: 'bloqueadora',
    hipotese:
      'Configuração de ambiente ausente (credenciais/endpoint não provisionados).',
    recomendacao:
      'Provisionar as variáveis de ambiente documentadas no .env.example e reexecutar a suíte dedicada.',
    responsavelSugerido: 'SDET/DevOps',
  },
  {
    padrao: /EAI_AGAIN|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ECONNRESET|network/i,
    classificacao: 'indisponibilidade de ambiente',
    severidade: 'alta',
    hipotese: 'Falha de rede ou serviço externo indisponível durante a execução.',
    recomendacao:
      'Verificar conectividade com o ambiente e repetir a execução; se persistir, registrar incidente de ambiente.',
    responsavelSugerido: 'SDET/infraestrutura',
  },
  {
    padrao: /provisionamento|teardown|limpeza da conta/i,
    classificacao: 'falha de dados',
    severidade: 'alta',
    hipotese: 'Massa de teste não pôde ser preparada ou removida (colisão, resíduo ou API de apoio indisponível).',
    recomendacao:
      'Inspecionar a conta/massa do cenário e a disponibilidade da API de apoio antes de classificar como defeito do produto.',
    responsavelSugerido: 'SDET',
  },
  {
    padrao: /Contrato violado|responseCode|HTTP status/i,
    classificacao: 'falha de produto',
    severidade: 'alta',
    hipotese: 'A API quebrou o contrato documentado ou a regra de negócio esperada.',
    recomendacao:
      'Comparar a resposta sanitizada em evidências com o contrato em cypress/schemas e abrir defeito com a evidência anexa.',
    responsavelSugerido: 'time de backend',
  },
  {
    padrao: /Timed out retrying|Expected to find element|cy\.(get|contains)/i,
    classificacao: 'falha de teste (provável)',
    severidade: 'média',
    hipotese:
      'Elemento não encontrado no tempo limite: seletor quebrado por mudança de UI ou lentidão do ambiente.',
    recomendacao:
      'Reproduzir manualmente; se a UI mudou, atualizar o page object encapsulado; se é lentidão recorrente, tratar como risco de ambiente.',
    responsavelSugerido: 'SDET',
  },
];

export const DEFAULT_CLASSIFICATION = {
  classificacao: 'não classificado — requer análise',
  severidade: 'a definir',
  hipotese: 'Falha sem padrão conhecido; analisar evidências antes de classificar.',
  recomendacao: 'Reproduzir com a evidência anexa e registrar a classificação neste registro.',
  responsavelSugerido: 'SDET',
};
