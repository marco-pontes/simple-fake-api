import './bootstrap.js';
import express from 'express';
import { loadConfig } from './config.js';
import { addExpressRoutes, mapRoutes } from './routes.js';
import { loadCollections } from './collections/index.js';
import type { SimpleFakeApi } from './utils/types';

// Uma variável de escopo do módulo para armazenar a instância do SimpleFakeApi após a inicialização.
let fastApi: SimpleFakeApi | null = null;

// Test-only helper to reset internal state between tests
export const __resetForTests = () => {
  fastApi = null;
};

export const getCollections = () => fastApi!.collections;

/**
 * Inicializa a configuração e as rotas do servidor Simple Fake API.
 * Esta função prepara o servidor, mas não o inicia.
 * * @returns {Promise<void>} Uma Promise que se resolve quando a inicialização estiver completa.
 */
export const initialize = async (): Promise<void> => {
  try {
    // Carrega a configuração e cria a instância do Express.
    const config = loadConfig();
    const collections = await loadCollections(config.apiDir, config.collectionsDir);
    const app = express();

    // Aplica o middleware do Express para parsear JSON.
    app.use(express.json());

    // Mapeia as rotas do diretório da API.
    const routeDefinitions = await mapRoutes(config.apiDir, config.wildcardChar);
    addExpressRoutes(app, routeDefinitions.literals, routeDefinitions.params);

    // Atribui a instância inicializada à variável global.
    fastApi = { config, app, collections };
    console.log('Simple Fake API foi inicializado com sucesso.');
  } catch (error) {
    console.error('Falha ao inicializar o servidor:', error);
    // Em um ambiente de produção, você pode querer lançar o erro
    // ou lidar com ele de forma diferente.
    process.exit(1);
  }
};

/**
 * Inicia o servidor Simple Fake API.
 * Esta função assume que a inicialização já foi concluída.
 * * @returns {void}
 */
export const start = (): void => {
  // Garante que o servidor foi inicializado antes de tentar iniciar.
  if (!fastApi) {
    console.error('O servidor não foi inicializado. Chame initialize() primeiro.');
    throw new Error('exit 1');
  }

  const { config, app } = fastApi;

  // Inicia o servidor Express.
  app.listen(config.port, () => {
    console.log(`Servidor Simple Fake API rodando na porta ${config.port}`);
    console.log(`URL base: http://localhost:${config.port}`);
  });
};
