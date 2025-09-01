// Lightweight HTTP client factory with environment-aware base URLs
// Usage in consumer: import { http } from '@marco-pontes/simple-fake-api/http'
// or: import { httpClient } from '@marco-pontes/simple-fake-api'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface EndpointConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

export interface HttpClientConfig {
  endpoints: Record<string, {
    dev: EndpointConfig;
    prod?: EndpointConfig;
    staging?: EndpointConfig;
    test?: EndpointConfig;
    default?: keyof EnvironmentMap;
  }>;
  // Environment resolver allows consumers to override via code if needed
  resolveEnv?: () => keyof EnvironmentMap;
}

export type Environment = 'dev' | 'prod' | 'staging' | 'test';
export type EnvironmentMap = Record<Environment, EndpointConfig>;

export interface CreateOptions {
  headers?: Record<string, string>;
}

export interface Client {
  get: (path: string, init?: RequestInit) => Promise<Response>;
  post: (path: string, body?: any, init?: RequestInit) => Promise<Response>;
  put: (path: string, body?: any, init?: RequestInit) => Promise<Response>;
  patch: (path: string, body?: any, init?: RequestInit) => Promise<Response>;
  delete: (path: string, init?: RequestInit) => Promise<Response>;
  head: (path: string, init?: RequestInit) => Promise<Response>;
  options: (path: string, init?: RequestInit) => Promise<Response>;
  request: (method: HttpMethod, path: string, init?: RequestInit) => Promise<Response>;
  baseUrl: string;
  headers: Record<string, string>;
}

const pickEnv = (cfg: HttpClientConfig): Environment => {
  if (cfg.resolveEnv) return cfg.resolveEnv();
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  if (nodeEnv.startsWith('prod')) return 'prod';
  if (nodeEnv.startsWith('stag')) return 'staging';
  if (nodeEnv.startsWith('test')) return 'test';
  return 'dev';
};

const joinUrl = (base: string, path: string) => {
  const b = base.replace(/\/$/, '');
  const p = path.replace(/^\//, '');
  return `${b}/${p}`;
};

const asJsonInit = (body: any, init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers || {});
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    return { ...init, headers, body: typeof body === 'string' ? body : JSON.stringify(body) };
  }
  return { ...init, headers, body };
};

export const http = (config: HttpClientConfig) => {
  const env = pickEnv(config);
  function create(endpointName: string, options?: CreateOptions): Client {
    const def = config.endpoints[endpointName];
    if (!def) throw new Error(`http: endpoint "${endpointName}" not found`);

    const envCfg: EndpointConfig | undefined = (def as any)[env] || (def as any)[def.default || 'dev'];
    if (!envCfg) throw new Error(`http: endpoint "${endpointName}" has no configuration for env ${env}`);

    const baseHeaders = { ...(envCfg.headers || {}), ...(options?.headers || {}) } as Record<string, string>;

    const request = async (method: HttpMethod, path: string, init?: RequestInit) => {
      const url = joinUrl(envCfg.baseUrl, path);
      const headers = new Headers({ ...baseHeaders, ...(init?.headers as any) });
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

// Convenience export to align with the described usage in the issue
export const client = { create: (...args: any[]) => (http as any)(...args) } as any;
