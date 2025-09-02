import { DEFAULT_CONFIG, VALID_WILDCARD_CHARS } from './utils/constants.js';
import type { SimpleFakeApiConfig } from './utils/types.js';

function readInjectedConfig(): Partial<SimpleFakeApiConfig> | undefined {
  try {
    // Bundlers will include simple-fake-api.config.js and define a global with its contents
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyGlobal: any = (typeof globalThis !== 'undefined') ? (globalThis as any) : {};
    const cfg = anyGlobal.__SIMPLE_FAKE_API_CONFIG__ as Partial<SimpleFakeApiConfig> | undefined;
    return cfg;
  } catch {
    return undefined;
  }
}

/**
 * Lê e valida as configurações da Simple Fake API. Agora lidas de configuração injetada pelo bundler.
 * @returns {SimpleFakeApiConfig} O objeto de configuração validado.
 * @throws {Error} Se o caractere curinga for inválido, o processo é encerrado.
 */
export const loadConfig = (): SimpleFakeApiConfig => {
  let config: SimpleFakeApiConfig = { ...DEFAULT_CONFIG };

  const userConfig = readInjectedConfig();
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
