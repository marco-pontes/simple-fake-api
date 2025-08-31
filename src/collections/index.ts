import { generate } from './data-generator.js';
import fs from 'fs';
import path from 'path';
import type { DataCollections } from '../utils/types';

// Armazena as coleções geradas em uma variável para evitar a regeneração
// a cada chamada da função `getCollections`.
let collections: DataCollections | null = null;

/**
 * Carrega e gera todas as coleções de dados simuladas a partir dos esquemas.
 * Esta função deve ser chamada apenas uma vez na inicialização da aplicação.
 * @returns {Promise<void>} Uma Promise que se resolve quando as coleções estiverem carregadas.
 * @param apiDir
 * @param collectionsFolder
 */
export async function loadCollections(
  apiDir: string,
  collectionsFolder: string,
): Promise<DataCollections> {
  if (collections) {
    console.warn('As coleções já foram carregadas. Ignorando a nova carga.');
    return collections;
  }

  const loadedCollections: DataCollections = {};

  try {
    // Caminho para o diretório de coleções.
    let currentDir = process.cwd();
    let collectionsDir = path.join(currentDir, apiDir, collectionsFolder);
    console.log(`Lendo o diretório: ${collectionsDir}`);

    // Lê todos os arquivos no diretório de coleções.
    const files = fs.readdirSync(collectionsDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        // Obtém o nome da coleção a partir do nome do arquivo (ex: 'users.json' -> 'users').
        const collectionName = path.basename(file, '.json');

        // Importa dinamicamente o esquema da coleção usando import()
        // Nota: O caminho deve ser um URL de arquivo para import() dinâmico funcionar corretamente.
        const modulePath = path.join(collectionsDir, file);
        const fileContent = fs.readFileSync(modulePath, 'utf8');

        // Analisa o conteúdo da string como um objeto JSON.
        const schema = JSON.parse(fileContent);

        console.log(`Gerando dados para a coleção: ${collectionName}`);

        // Gera os dados a partir do esquema usando o data-generator.
        loadedCollections[collectionName] = await generate(schema);
      }
    }

    // Atribui o resultado para a variável de cache.
    collections = loadedCollections;
    console.log('Coleções carregadas com sucesso.');
  } catch (error) {
    console.error('Erro ao carregar coleções:', error);
    // Em caso de erro, define o cache como um objeto vazio para evitar falhas futuras.
    collections = {};
  }
  return collections;
}

/**
 * Redefine o cache de coleções.
 * Esta função é útil para testes, garantindo que cada teste comece com um estado limpo.
 */
export function resetCollectionsCache() {
  collections = null;
}
