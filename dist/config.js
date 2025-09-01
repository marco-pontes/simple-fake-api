import path from 'path';
import fs from 'fs';
import { DEFAULT_CONFIG, VALID_WILDCARD_CHARS } from './utils/constants';
/**
 * Lê e valida as configurações da Simple Fake API a partir do arquivo package.json.
 * @returns {SimpleFakeApiConfig} O objeto de configuração validado.
 * @throws {Error} Se o caractere curinga for inválido, o processo é encerrado.
 */
export const loadConfig = () => {
    const currentDir = process.cwd();
    const packageJsonPath = path.join(currentDir, 'package.json');
    let config = { ...DEFAULT_CONFIG };
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const userConfig = packageJson['simple-fake-api-config'];
        // Se o usuário forneceu configurações, mescla com as padrão.
        if (userConfig) {
            config = { ...config, ...userConfig };
        }
        else {
            console.info('Configuração "simple-fake-api-config" não encontrada no package.json. Usando configurações padrão.');
        }
    }
    catch (e) {
        console.info('Não foi possível ler o package.json. Usando configurações padrão (procuramos "simple-fake-api-config").');
    }
    const { wildcardChar } = config;
    // A validação agora usa o conjunto de caracteres seguros.
    if (wildcardChar.length !== 1 || !VALID_WILDCARD_CHARS.has(wildcardChar)) {
        console.error(`O "wildcardChar" deve ser um único caractere especial válido. Caracteres permitidos: ${Array.from(VALID_WILDCARD_CHARS).join(' ')}`);
        process.exit(1);
    }
    return config;
};
