import './bootstrap.js';
export { create as http } from './http-client.js';
export { loadHttpClientConfigFromPackageJson } from './utils/pkg.js';
export type { Request, Response } from 'express';
export declare const __resetForTests: () => void;
export declare const getCollections: () => object;
/**
 * Inicializa a configuração e as rotas do servidor Simple Fake API.
 * Esta função prepara o servidor, mas não o inicia.
 * * @returns {Promise<void>} Uma Promise que se resolve quando a inicialização estiver completa.
 */
export declare const initialize: () => Promise<void>;
/**
 * Inicia o servidor Simple Fake API.
 * Esta função assume que a inicialização já foi concluída.
 * * @returns {void}
 */
export declare const start: () => void;
