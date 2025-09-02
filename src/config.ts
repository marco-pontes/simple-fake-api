import { DEFAULT_CONFIG, VALID_WILDCARD_CHARS } from './utils/constants.js';
import type { SimpleFakeApiConfig } from './utils/types.js';
import { loadSimpleFakeApiConfigSync } from './utils/config-loader.js';

/**
 * Lê e valida as configurações da Simple Fake API a partir do arquivo simple-fake-api.config.* de forma síncrona.
 * @returns {SimpleFakeApiConfig} O objeto de configuração validado.
 * @throws {Error} Se o caractere curinga for inválido, o processo é encerrado.
 */
export const loadConfig = (): SimpleFakeApiConfig => {
  let config: SimpleFakeApiConfig = { ...DEFAULT_CONFIG };

  const userConfig = loadSimpleFakeApiConfigSync();
  if (userConfig) {
    config = { ...config, ...userConfig } as SimpleFakeApiConfig;
  } else {
    console.info('Configuração não encontrada. Usando configurações padrão.');
  }

  const { wildcardChar } = config;

  // A validação agora usa o conjunto de caracteres seguros.
  if (wildcardChar.length !== 1 || !VALID_WILDCARD_CHARS.has(wildcardChar)) {
    console.error(
      `O "wildcardChar" deve ser um único caractere especial válido. Caracteres permitidos: ${Array.from(VALID_WILDCARD_CHARS).join(' ')}`,
    );
    process.exit(1);
  }

  return config;
};
