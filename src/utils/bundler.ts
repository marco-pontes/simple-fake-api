// Utilities to help consumers inject HTTP client configuration at build time via bundlers
// The library's http-client will read from a global __SIMPLE_FAKE_API_HTTP__ if defined.
// Use the helper below in Vite or Webpack to create that definition from a config object you construct in your bundler config.

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export interface InjectedHttpConfig {
  endpoints: Record<string, { baseUrl: string; headers?: Record<string, string> }>;
}

interface FullConfigFileShape {
  port: number;
  apiDir: string;
  collectionsDir: string;
  wildcardChar: string;
  http?: {
    endpoints: Record<string, Record<string, { baseUrl: string; headers?: Record<string, string> }>>;
  };
}

function loadUserConfigFile(): any {
  const cfgPath = path.join(process.cwd(), 'simple-fake-api.config.js');
  // Try require (CommonJS)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(cfgPath);
    return mod?.default ?? mod;
  } catch {
    // Try dynamic import (ESM)
    try {
      const url = pathToFileURL(cfgPath).href;
      // @ts-ignore
        const mod: any = (new Function('u', 'return import(u)'))(url);
      // Not awaitable synchronously; fall back to reading file as JSON-like CJS
    } catch {
      // ignore
    }
  }
  // Last resort: attempt to eval module.exports style or JSON
  try {
    const raw = fs.readFileSync(cfgPath, 'utf8');
    if (raw.trim().startsWith('{')) return JSON.parse(raw);
  } catch {}
  throw new Error('simple-fake-api/bundler: could not load simple-fake-api.config.js');
}

function buildHttpForEnv(cfg: FullConfigFileShape, envName: string): InjectedHttpConfig {
  const endpoints: Record<string, { baseUrl: string; headers?: Record<string, string> }> = {};
  const http = cfg.http?.endpoints || {};
  const isDev = envName === 'development' || envName === 'dev';
  for (const [name, envs] of Object.entries(http)) {
    if (isDev) {
      endpoints[name] = { baseUrl: `http://localhost:${cfg.port}` };
    } else {
      const envCfg = (envs as any)[envName] || (envs as any).prod || (envs as any).staging;
      if (!envCfg?.baseUrl) {
        throw new Error(`simple-fake-api/bundler: missing baseUrl for endpoint "${name}" in env "${envName}"`);
      }
      endpoints[name] = { baseUrl: envCfg.baseUrl, headers: envCfg.headers };
    }
  }
  return { endpoints };
}

// Plugin-style helper to generate define map for bundlers from the user's config file and environment name.
// Vite example:
//   import { defineConfig } from 'vite';
//   import { setupSimpleFakeApiHttpRoutes } from '@marco-pontes/simple-fake-api/bundler';
//   export default defineConfig(() => ({
//     define: { ...setupSimpleFakeApiHttpRoutes(process.env.NODE_ENV || 'development') },
//   }));
//
// Webpack example:
//   new webpack.DefinePlugin(setupSimpleFakeApiHttpRoutes(process.env.NODE_ENV || 'production'))
export function setupSimpleFakeApiHttpRoutes(environment: string): Record<string, any> {
  const cfg = loadUserConfigFile() as FullConfigFileShape;
  const http = buildHttpForEnv(cfg, environment);
  // Expose both HTTP and server config to runtime
  const serverConfig = {
    port: cfg.port,
    apiDir: cfg.apiDir,
    collectionsDir: cfg.collectionsDir,
    wildcardChar: cfg.wildcardChar,
  };
  return {
    __SIMPLE_FAKE_API_HTTP__: JSON.stringify(http),
    __SIMPLE_FAKE_API_CONFIG__: JSON.stringify(serverConfig),
  };
}
