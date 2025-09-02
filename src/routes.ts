import type { Express } from 'express';
import { glob } from 'glob';
import path from 'path';
import { createRequire } from 'module';
import type { RouteDefinition, RouteHandlers } from './utils/types.js';

/**
 * Mapeia arquivos JavaScript/TypeScript para definições de rota, separando-os
 * em rotas literais e rotas com parâmetros para garantir a ordem correta.
 * @param {string} apiDir O diretório base da API.
 * @param {string} wildcardChar O caractere curinga para parâmetros de rota.
 * @returns {Promise<{literals: RouteDefinition[], params: RouteDefinition[]}>} Listas de definições de rota.
 */
export const mapRoutes = async (
  apiDir: string,
  wildcardChar: string,
  routeFileExtension: 'js' | 'ts' = 'js',
): Promise<{ literals: RouteDefinition[]; params: RouteDefinition[] }> => {
  const literalRouteDefinitions: RouteDefinition[] = [];
  const paramRouteDefinitions: RouteDefinition[] = [];
  const currentDir = process.cwd();
  const apiPath = path.join(currentDir, apiDir);

  const pattern = `**/*.${routeFileExtension}`;
  const files = await glob(pattern, { cwd: apiPath, ignore: 'collections/*' });

  // If we're dealing with TypeScript route files, try to register ts-node to allow runtime loading
  const isTs = routeFileExtension === 'ts';
  let req: NodeRequire | null = null;
  if (isTs) {
    try {
      req = createRequire(import.meta.url);
      try {
        // Prefer transpile-only for speed; fall back to full register
        (req as any).resolve('ts-node/register/transpile-only');
        (req as any)('ts-node/register/transpile-only');
      } catch {
        try {
          (req as any).resolve('ts-node/register');
          (req as any)('ts-node/register');
        } catch {
          console.warn('simple-fake-api: ts-node not found. Attempting native import of .ts files may fail. Install devDependency: ts-node');
        }
      }
    } catch {}
  }

  for (const file of files) {
    const extRegex = new RegExp(`\\.${routeFileExtension}$`);
    let route = '/' + file.replace(extRegex, '');
    const hasParam = route.includes(wildcardChar);
    route = route.replace(new RegExp(wildcardChar + '([^/]+)', 'g'), ':$1');

    if (file.endsWith(`/index.${routeFileExtension}`)) {
      route = route.replace('/index', '');
    }

    const modulePath = path.join(apiPath, file);
    try {
      let handlers: RouteHandlers;
      if (isTs && req) {
        // Use CommonJS require through ts-node hook so .ts files are transpiled on the fly
        const mod = (req as any)(modulePath);
        handlers = (mod && (mod.default ?? mod)) as RouteHandlers;
      } else {
        const mod = await import(modulePath);
        handlers = (mod && (mod as any).default ? (mod as any).default : (mod as any)) as RouteHandlers;
      }

      Object.keys(handlers || {}).forEach((method) => {
        const normalized = method.toUpperCase();
        const valid = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'ALL'];
        if (!valid.includes(normalized)) return;
        const handler = (handlers as any)[method];
        if (typeof handler === 'function') {
          const definition: RouteDefinition = {
            route: route,
            method: normalized,
            handler: handler,
          };
          // Separa as rotas para garantir a ordem de prioridade.
          if (hasParam) {
            paramRouteDefinitions.push(definition);
          } else {
            literalRouteDefinitions.push(definition);
          }
        }
      });
    } catch (e) {
      console.error(`Erro ao carregar o arquivo ${file}:`, e);
    }
  }
  return {
    literals: literalRouteDefinitions,
    params: paramRouteDefinitions,
  };
};

/**
 * Adiciona as definições de rota ao servidor Express, priorizando rotas literais.
 * @param app O aplicativo Express.
 * @param {RouteDefinition[]} literalRoutes A lista de definições de rota literais.
 * @param {RouteDefinition[]} paramRoutes A lista de definições de rota com parâmetros.
 * @returns {void}
 */
export const addExpressRoutes = (
  app: Express,
  literalRoutes: RouteDefinition[],
  paramRoutes: RouteDefinition[],
): void => {
  // Primeiro, adiciona todas as rotas literais.
  for (const definition of literalRoutes) {
    const expressMethod = definition.method.toLowerCase();
    if (app[expressMethod as keyof Express]) {
      (app as any)[expressMethod](definition.route, definition.handler);
      console.log(`Mapped: ${definition.method.toUpperCase()} -> ${definition.route}`);
    }
  }

  // Em seguida, adiciona todas as rotas com parâmetros.
  for (const definition of paramRoutes) {
    const expressMethod = definition.method.toLowerCase();
    if (app[expressMethod as keyof Express]) {
      (app as any)[expressMethod](definition.route, definition.handler);
      console.log(`Mapped: ${definition.method.toUpperCase()} -> ${definition.route}`);
    }
  }
};
