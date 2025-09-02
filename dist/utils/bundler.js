// Utilities to help consumers inject HTTP client configuration at build time via bundlers
// The library's http-client will read from a global __SIMPLE_FAKE_API_HTTP__ if defined.
// Use the helper below in Vite or Webpack to create that definition from a config object you construct in your bundler config.
import fs from 'fs';
import path from 'path';
import { loadSimpleFakeApiConfigSync } from './fake-api-config-file.js';
function loadUserConfigFile() {
    const cfg = loadSimpleFakeApiConfigSync();
    if (cfg)
        return cfg;
    const tried = [
        path.join(process.env.INIT_CWD && fs.existsSync(path.join(process.env.INIT_CWD, 'package.json')) ? process.env.INIT_CWD : process.cwd(), 'simple-fake-api.config.js'),
        path.join(process.env.INIT_CWD && fs.existsSync(path.join(process.env.INIT_CWD, 'package.json')) ? process.env.INIT_CWD : process.cwd(), 'simple-fake-api.config.cjs'),
        path.join(process.env.INIT_CWD && fs.existsSync(path.join(process.env.INIT_CWD, 'package.json')) ? process.env.INIT_CWD : process.cwd(), 'simple-fake-api.config.mjs'),
        path.join(process.env.INIT_CWD && fs.existsSync(path.join(process.env.INIT_CWD, 'package.json')) ? process.env.INIT_CWD : process.cwd(), 'simple-fake-api.config.ts'),
        path.join(process.env.INIT_CWD && fs.existsSync(path.join(process.env.INIT_CWD, 'package.json')) ? process.env.INIT_CWD : process.cwd(), 'simple-fake-api.config.cts'),
    ];
    const msg = [
        'simple-fake-api/bundler: could not load simple-fake-api.config.js.',
        `Checked paths: ${tried.join(', ') || '(none found)'}.`,
        'Ensure the file exists at your project root and uses CommonJS export (module.exports = { ... }).',
        'If you must use ESM (.mjs), convert it to CommonJS or re-export as module.exports for the bundler to load synchronously.',
    ].join(' ');
    throw new Error(msg);
}
function buildHttpForEnv(cfg, envName) {
    const endpoints = {};
    const http = cfg.http?.endpoints || {};
    const isDev = envName === 'development' || envName === 'dev';
    for (const [name, envs] of Object.entries(http)) {
        if (isDev) {
            endpoints[name] = { baseUrl: `http://localhost:${cfg.port}` };
        }
        else {
            const envCfg = envs[envName] || envs.prod || envs.staging;
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
export function setupSimpleFakeApiHttpRoutes(environment) {
    const cfg = loadUserConfigFile();
    const http = buildHttpForEnv(cfg, environment);
    // Helpful log to show which config file and env were used
    try {
        const initCwd = process.env.INIT_CWD;
        const baseDir = initCwd && fs.existsSync(path.join(initCwd, 'package.json')) ? initCwd : process.cwd();
        const possible = ['simple-fake-api.config.js', 'simple-fake-api.config.cjs', 'simple-fake-api.config.mjs', 'simple-fake-api.config.ts', 'simple-fake-api.config.cts']
            .map(f => path.join(baseDir, f));
        const picked = possible.find(p => fs.existsSync(p));
        if (picked) {
            console.log(`simple-fake-api/bundler: using ${environment} environment with config file: ${picked}`);
        }
        else {
            console.log(`simple-fake-api/bundler: using ${environment} environment (no config file found)`);
        }
    }
    catch { }
    return {
        __SIMPLE_FAKE_API_HTTP__: JSON.stringify(http),
    };
}
