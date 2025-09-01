import './bootstrap.js';
export { http as httpClientFactory, client as http } from './http-client.js';
export { httpFromPackageJson, loadHttpClientConfigFromPackageJson } from './http-client.js';
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
