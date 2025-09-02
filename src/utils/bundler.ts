// Utilities to help consumers inject HTTP client configuration at build time via bundlers
// The library's http-client will read from a global __SIMPLE_FAKE_API_HTTP__ if defined.
// Use the helper below in Vite or Webpack to create that definition from a config object you construct in your bundler config.

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

import type { SimpleFakeApiConfig } from './types.js';

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
  // Resolve base directory: prefer INIT_CWD (original install/run cwd), then process.cwd()
  const initCwd = process.env.INIT_CWD;
  const baseDir = initCwd && fs.existsSync(path.join(initCwd, 'package.json')) ? initCwd : process.cwd();
  const candidates = [
    path.join(baseDir, 'simple-fake-api.config.js'),
    path.join(baseDir, 'simple-fake-api.config.cjs'),
    path.join(baseDir, 'simple-fake-api.config.mjs'),
    path.join(baseDir, 'simple-fake-api.config.ts'),
    path.join(baseDir, 'simple-fake-api.config.cts'),
  ];

  const tried: string[] = [];

  // Try CommonJS via require for .js/.cjs and transpile .ts/.cts on the fly if ts-node/register is available
  const req = createRequire(import.meta.url);
  for (const p of candidates) {
    tried.push(p);
    if (!fs.existsSync(p)) continue;
    const ext = path.extname(p);
    if (ext === '.ts' || ext === '.cts') {
      try {
        // Attempt to register ts-node if present in the consumer project
        try { req.resolve('ts-node/register'); (req as any)('ts-node/register'); } catch {}
        const mod = req(p);
        console.log(`simple-fake-api/bundler: loaded config file: ${p}`);
        return (mod && (mod.default ?? mod));
      } catch (e: any) {
        // Fallthrough to helpful error below
      }
    }
    if (ext === '.js' || ext === '.cjs') {
      try {
        const mod = req(p);
        console.log(`simple-fake-api/bundler: loaded config file: ${p}`);
        return (mod && (mod.default ?? mod));
      } catch (e: any) {
        // If the file is ESM-only, require will throw ERR_REQUIRE_ESM; we will handle below
        if (e && (e.code === 'ERR_REQUIRE_ESM' || /Cannot use import statement/.test(String(e.message)))) {
          // fall through to ESM note below
        } else {
          // Other errors: rethrow with context
          throw new Error(`simple-fake-api/bundler: failed to require ${p}: ${e?.message || e}`);
        }
      }
    }
  }

  // We intentionally avoid async dynamic import here to keep bundler config synchronous.
  // Suggest using CommonJS export when ESM is detected or use a TypeScript config with ts-node available.
  const msg = [
    'simple-fake-api/bundler: could not load simple-fake-api.config.js.',
    `Checked paths: ${tried.join(', ') || '(none found)'}.`,
    'Ensure the file exists at your project root and uses CommonJS export (module.exports = { ... }).',
    'If you must use ESM (.mjs), convert it to CommonJS or re-export as module.exports for the bundler to load synchronously.',
  ].join(' ');
  throw new Error(msg);
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
    routeFileExtension: (cfg as any).routeFileExtension || 'js',
  };
  // Helpful log to show which config file and env were used
  try {
    const initCwd = process.env.INIT_CWD;
    const baseDir = initCwd && fs.existsSync(path.join(initCwd, 'package.json')) ? initCwd : process.cwd();
    const possible = ['simple-fake-api.config.js','simple-fake-api.config.cjs','simple-fake-api.config.mjs','simple-fake-api.config.ts','simple-fake-api.config.cts']
      .map(f => path.join(baseDir, f));
    const picked = possible.find(p => fs.existsSync(p));
    if (picked) {
      console.log(`simple-fake-api/bundler: using ${environment} environment with config file: ${picked}`);
    } else {
      console.log(`simple-fake-api/bundler: using ${environment} environment (no config file found)`);
    }
  } catch {}
  return {
    __SIMPLE_FAKE_API_HTTP__: JSON.stringify(http),
    __SIMPLE_FAKE_API_CONFIG__: JSON.stringify(serverConfig),
  };
}

// Public types for consumers' config authoring in examples
export type { SimpleFakeApiConfig };
