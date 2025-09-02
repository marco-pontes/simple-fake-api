import type { Express } from 'express';
import type { RouteDefinition } from './utils/types.js';
/**
 * Mapeia arquivos JavaScript/TypeScript para definições de rota, separando-os
 * em rotas literais e rotas com parâmetros para garantir a ordem correta.
 * @param {string} apiDir O diretório base da API.
 * @param {string} wildcardChar O caractere curinga para parâmetros de rota.
 * @returns {Promise<{literals: RouteDefinition[], params: RouteDefinition[]}>} Listas de definições de rota.
 */
export declare const mapRoutes: (apiDir: string, wildcardChar: string, routeFileExtension?: "js" | "ts") => Promise<{
    literals: RouteDefinition[];
    params: RouteDefinition[];
}>;
/**
 * Adiciona as definições de rota ao servidor Express, priorizando rotas literais.
 * @param app O aplicativo Express.
 * @param {RouteDefinition[]} literalRoutes A lista de definições de rota literais.
 * @param {RouteDefinition[]} paramRoutes A lista de definições de rota com parâmetros.
 * @returns {void}
 */
export declare const addExpressRoutes: (app: Express, literalRoutes: RouteDefinition[], paramRoutes: RouteDefinition[]) => void;
