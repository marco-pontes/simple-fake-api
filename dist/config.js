import { DEFAULT_CONFIG, VALID_WILDCARD_CHARS } from './utils/constants.js';
import { readSimpleFakeApiConfig } from './utils/pkg.js';
/**
 * Lê e valida as configurações da Simple Fake API a partir do arquivo package.json.
 * @returns {SimpleFakeApiConfig} O objeto de configuração validado.
 * @throws {Error} Se o caractere curinga for inválido, o processo é encerrado.
 */
export const loadConfig = () => {
    let config = { ...DEFAULT_CONFIG };
    const userConfig = readSimpleFakeApiConfig();
    if (userConfig) {
        config = { ...config, ...userConfig };
    }
    else {
        console.info('Configuração "simple-fake-api-config" não encontrada no package.json. Usando configurações padrão.');
    }
    const { wildcardChar } = config;
    // A validação agora usa o conjunto de caracteres seguros.
    if (wildcardChar.length !== 1 || !VALID_WILDCARD_CHARS.has(wildcardChar)) {
        console.error(`O "wildcardChar" deve ser um único caractere especial válido. Caracteres permitidos: ${Array.from(VALID_WILDCARD_CHARS).join(' ')}`);
        process.exit(1);
    }
    return config;
};
