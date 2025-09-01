import type { SimpleFakeApiConfig } from './types.js';
/**
 * Lê e valida as configurações da Simple Fake API a partir do arquivo package.json.
 * @returns {SimpleFakeApiConfig} O objeto de configuração validado.
 * @throws {Error} Se o caractere curinga for inválido, o processo é encerrado.
 */
export declare const loadConfig: () => SimpleFakeApiConfig;
