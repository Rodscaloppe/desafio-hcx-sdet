import { defineConfig } from 'cypress';
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
import createBundler from '@bahmutov/cypress-esbuild-preprocessor';
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Configuração central do Cypress.
 *
 * Toda parametrização sensível ao ambiente vem de variáveis de ambiente
 * (arquivo .env local ou variáveis de CI), mapeadas para `Cypress.env`.
 * Segredos nunca entram no repositório: apenas nomes de variáveis aqui.
 */
export default defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL ?? 'https://automationexercise.com',
    specPattern: 'cypress/e2e/features/**/*.feature',
    supportFile: 'cypress/support/e2e.ts',

    defaultCommandTimeout: Number(process.env.DEFAULT_TIMEOUT ?? 10000),
    pageLoadTimeout: Number(process.env.PAGE_LOAD_TIMEOUT ?? 60000),
    requestTimeout: Number(process.env.API_TIMEOUT ?? 15000),

    // Política de retry: apenas em CI (run mode), limitado a 1 tentativa extra.
    // Retry não substitui correção: cenários instáveis são reportados na triagem.
    retries: process.env.CI === 'true' ? { runMode: 1, openMode: 0 } : 0,

    video: true,
    screenshotOnRunFailure: true,

    // Terceiros de publicidade/telemetria do site público não fazem parte do
    // escopo funcional; bloqueá-los reduz flakiness e tempo de carregamento.
    blockHosts: [
      '*.google-analytics.com',
      '*.googlesyndication.com',
      '*.doubleclick.net',
      '*.adservice.google.com',
      '*.googletagmanager.com',
    ],

    env: {
      // Suítes/tags são selecionadas via --env tags='...' nos scripts npm.
      AE_API_URL: process.env.AE_API_URL ?? 'https://automationexercise.com/api',
      TEST_USER_EMAIL: process.env.TEST_USER_EMAIL ?? '',
      TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD ?? '',
      TRELLO_API_BASE: process.env.TRELLO_API_BASE ?? 'https://api.trello.com/1',
      TRELLO_API_KEY: process.env.TRELLO_API_KEY ?? '',
      TRELLO_API_TOKEN: process.env.TRELLO_API_TOKEN ?? '',
      TRELLO_LIST_ID: process.env.TRELLO_LIST_ID ?? '',
    },

    async setupNodeEvents(
      on: Cypress.PluginEvents,
      config: Cypress.PluginConfigOptions,
    ): Promise<Cypress.PluginConfigOptions> {
      await addCucumberPreprocessorPlugin(on, config);
      on(
        'file:preprocessor',
        createBundler({
          plugins: [
            // cast necessário: o preprocessador Cucumber carrega sua própria
            // tipagem de Plugin do esbuild, estruturalmente equivalente.
            createEsbuildPlugin(
              config,
            ) as unknown as import('esbuild').Plugin,
          ],
        }),
      );
      return config;
    },
  },
});
