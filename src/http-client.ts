// Lightweight HTTP client factory with environment-aware base URLs
// Usage in consumer: import { http } from '@marco-pontes/simple-fake-api/http'
// or: import { httpClient } from '@marco-pontes/simple-fake-api'

import type {
  HttpMethod,
  EndpointConfig,
  HttpClientConfig,
  Environment,
  CreateOptions,
  Client,
} from './utils/types.js';

// Re-export the Client type for consumers importing from the http subpath
export type { Client } from './utils/types.js';

/**
 * Resolve current environment name for selecting endpoint configuration.
 * Priority: config.resolveEnv() -> NODE_ENV (prod/staging/test) -> dev
 */
const pickEnv = (cfg: HttpClientConfig): Environment => {
  if (cfg.resolveEnv) return cfg.resolveEnv();
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  if (nodeEnv.startsWith('prod')) return 'prod';
  if (nodeEnv.startsWith('stag')) return 'staging';
  if (nodeEnv.startsWith('test')) return 'test';
  return 'dev';
};

/** Join base URL and path, ensuring single slash between. */
const joinUrl = (base: string, path: string) => {
  const b = base.replace(/\/$/, '');
  const p = path.replace(/^\//, '');
  return `${b}/${p}`;
};

/** Build RequestInit for JSON body if a plain object/string is provided. */
const asJsonInit = (body: any, init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers || {});
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    return { ...init, headers, body: typeof body === 'string' ? body : JSON.stringify(body) };
  }
  return { ...init, headers, body };
};

/**
 * Create an HTTP client factory bound to the given configuration.
 * Use factory.create(endpointName) to obtain a client with helpers for HTTP verbs.
 */
// Internal builder to create a client from a resolved config
const buildFactory = (config: HttpClientConfig) => {
  const env = pickEnv(config);
  function create(endpointName: string, options?: CreateOptions): Client {
    const def = config.endpoints[endpointName];
    if (!def) throw new Error(`http: endpoint "${endpointName}" not found`);

    const envCfg: EndpointConfig | undefined = (def as any)[env] || (def as any)[def.default || 'dev'];
    if (!envCfg) throw new Error(`http: endpoint "${endpointName}" has no configuration for env ${env}`);

    const baseHeaders = { ...(envCfg.headers || {}), ...(options?.headers || {}) } as Record<string, string>;

    const request = async (method: HttpMethod, path: string, init?: RequestInit) => {
      const url = joinUrl(envCfg.baseUrl, path);
      // Merge baseHeaders with any provided init.headers. Use Headers API to preserve existing values
      const headers = new Headers(baseHeaders as any);
      if (init?.headers) {
        new Headers(init.headers as any).forEach((value, key) => headers.set(key, value));
      }
      const rInit = { ...init, method, headers } as RequestInit;
      return fetch(url, rInit);
    };

    const withJson = (method: HttpMethod) => (path: string, body?: any, init?: RequestInit) =>
      request(method, path, asJsonInit(body, init));

    const client: Client = {
      baseUrl: envCfg.baseUrl,
      headers: baseHeaders,
      request,
      get: (p, i) => request('GET', p, i),
      delete: (p, i) => request('DELETE', p, i),
      head: (p, i) => request('HEAD', p, i),
      options: (p, i) => request('OPTIONS', p, i),
      post: withJson('POST'),
      put: withJson('PUT'),
      patch: withJson('PATCH'),
    };

    return client;
  }

  return { create };
};

// New public API: create(endpointName, options?) which reads config from package.json
import { loadHttpClientConfigFromPackageJson } from './utils/pkg.js';
export function create(endpointName: string, options?: CreateOptions, customPackageJsonPath?: string): Client {
  const cfg = loadHttpClientConfigFromPackageJson(customPackageJsonPath);
  const factory = buildFactory(cfg);
  return factory.create(endpointName, options);
}
