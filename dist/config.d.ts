import type { SimpleFakeApiConfig } from './utils/types.js';
/**
 * Lê e valida as configurações da Simple Fake API a partir do arquivo simple-fake-api.config.* de forma síncrona.
 * @returns {SimpleFakeApiConfig} O objeto de configuração validado.
 * @throws {Error} Se o caractere curinga for inválido, o processo é encerrado.
 */
export declare const loadConfig: () => SimpleFakeApiConfig;
