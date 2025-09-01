import type { DataCollections } from '../utils/types';
/**
 * Carrega e gera todas as coleções de dados simuladas a partir dos esquemas.
 * Esta função deve ser chamada apenas uma vez na inicialização da aplicação.
 * @returns {Promise<void>} Uma Promise que se resolve quando as coleções estiverem carregadas.
 * @param apiDir
 * @param collectionsFolder
 */
export declare function loadCollections(apiDir: string, collectionsFolder: string): Promise<DataCollections>;
/**
 * Redefine o cache de coleções.
 * Esta função é útil para testes, garantindo que cada teste comece com um estado limpo.
 */
export declare function resetCollectionsCache(): void;
