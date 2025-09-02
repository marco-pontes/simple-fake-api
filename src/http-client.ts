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
// New public API: create(endpointName, options?) which reads config from package.json
// Re-export the Client type for consumers importing from the http subpath
export type { Client } from './utils/types.js';
// Also re-export Express Request/Response types from the http subpath
export type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

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
const buildFactory = (config: HttpClientConfig, defaultBaseUrl?: string) => {
  const env = pickEnv(config);
  function create(endpointName: string, options?: CreateOptions): Client {
    const def: any = config.endpoints[endpointName];
    let envCfg: EndpointConfig | undefined;
    if (!def) {
      // No declaration for this endpoint; use defaultBaseUrl if provided (e.g., from localhost:port fallback)
      if (defaultBaseUrl) {
        envCfg = { baseUrl: defaultBaseUrl };
      } else {
        throw new Error(`http: endpoint "${endpointName}" not found`);
      }
    } else if (def && typeof def === 'object' && 'baseUrl' in def) {
      // Flattened shape injected by new bundler plugin
      envCfg = { baseUrl: def.baseUrl, headers: def.headers };
    } else {
      envCfg = def[env] || def[def.default || 'dev'];
      if (!envCfg) throw new Error(`http: endpoint "${endpointName}" has no configuration for env ${env}`);
    }

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


function resolveInjectedConfig(): any | undefined {
  try {
    // Value should be injected at build time by bundlers using the helper in bundler subpath (@marco-pontes/simple-fake-api/bundler)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyGlobal: any = (typeof globalThis !== 'undefined') ? (globalThis as any) : {};
    return anyGlobal.__SIMPLE_FAKE_API_HTTP__;
  } catch {
    return undefined;
  }
}

export function create(endpointName: string, options?: CreateOptions, customPackageJsonPath?: string): Client {
  // 1) Prefer build-time injected config for browser/runtime without FS
  const injected = resolveInjectedConfig();
  if (injected && injected.endpoints) {
    const factory = buildFactory(injected as HttpClientConfig);
    return factory.create(endpointName, options);
  }
  // 2) Node/dev: fallback to localhost:<port> from simple-fake-api-config.port
  const port = (() => {
    try {
      const pkgPath = customPackageJsonPath || path.join(process.cwd(), 'package.json');
      const raw = fs.readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(raw);
      return pkg?.['simple-fake-api-config']?.port as number | undefined;
    } catch {
      return undefined;
    }
  })();
  if (port) {
    const factory = buildFactory({ endpoints: {} as any } as HttpClientConfig, `http://localhost:${port}`);
    return factory.create(endpointName, options);
  }
  // Last resort: error
  throw new Error('simple-fake-api/http: no configuration provided. Provide build-time config via __SIMPLE_FAKE_API_HTTP__ or set simple-fake-api-config.port for localhost fallback');
}
