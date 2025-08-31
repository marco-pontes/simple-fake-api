import path from 'path';
import fs from 'fs';
import { DEFAULT_CONFIG, VALID_WILDCARD_CHARS } from './utils/constants.js';
import type { FastApiConfig } from './utils/types';

/**
 * Lê e valida as configurações da Fast API a partir do arquivo package.json.
 * @returns {FastApiConfig} O objeto de configuração validado.
 * @throws {Error} Se o caractere curinga for inválido, o processo é encerrado.
 */
export const loadConfig = (): FastApiConfig => {
  const currentDir = process.cwd();
  const packageJsonPath = path.join(currentDir, 'package.json');

  let config: FastApiConfig = { ...DEFAULT_CONFIG };

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const userConfig = packageJson['fast-api-config'];

    // Se o usuário forneceu configurações, mescla com as padrão.
    if (userConfig) {
      config = { ...config, ...userConfig };
    } else {
      console.info(
        'Configuração "fast-api-config" não encontrada ou inválida no package.json. Usando configurações padrão.',
      );
    }
  } catch (e: any) {
    console.info(
      'Configuração "fast-api-config" não encontrada ou inválida no package.json. Usando configurações padrão.',
    );
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
