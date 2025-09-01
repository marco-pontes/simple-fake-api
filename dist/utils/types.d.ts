import express from 'express';
/**
 * Interface para a estrutura das configurações da Fast API no package.json.
 */
export interface SimpleFakeApiConfig {
    port: number;
    apiDir: string;
    wildcardChar: string;
    collectionsDir: string;
}
export interface SimpleFakeApi {
    config: SimpleFakeApiConfig;
    app: express.Express;
    collections: object;
}
/**
 * Interface para as coleções de dados.
 */
export interface DataCollections {
    [key: string]: any[];
}
/**
 * Interface que representa os manipuladores de rotas exportados de um arquivo.
 */
export interface RouteHandlers {
    [key: string]: (req: any, res: any) => void;
}
/**
 * Interface para a definição de uma rota.
 */
export interface RouteDefinition {
    route: string;
    method: string;
    handler: (req: any, res: any) => void;
}
