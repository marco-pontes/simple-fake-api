// Lightweight HTTP client factory with environment-aware base URLs
// Usage in consumer: import { http } from '@marco-pontes/simple-fake-api/http'
// or: import { httpClient } from '@marco-pontes/simple-fake-api'
const pickEnv = (cfg) => {
    if (cfg.resolveEnv)
        return cfg.resolveEnv();
    const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
    if (nodeEnv.startsWith('prod'))
        return 'prod';
    if (nodeEnv.startsWith('stag'))
        return 'staging';
    if (nodeEnv.startsWith('test'))
        return 'test';
    return 'dev';
};
const joinUrl = (base, path) => {
    const b = base.replace(/\/$/, '');
    const p = path.replace(/^\//, '');
    return `${b}/${p}`;
};
const asJsonInit = (body, init) => {
    const headers = new Headers(init?.headers || {});
    if (body !== undefined && body !== null && !(body instanceof FormData)) {
        if (!headers.has('content-type'))
            headers.set('content-type', 'application/json');
        return { ...init, headers, body: typeof body === 'string' ? body : JSON.stringify(body) };
    }
    return { ...init, headers, body };
};
export const http = (config) => {
    const env = pickEnv(config);
    function create(endpointName, options) {
        const def = config.endpoints[endpointName];
        if (!def)
            throw new Error(`http: endpoint "${endpointName}" not found`);
        const envCfg = def[env] || def[def.default || 'dev'];
        if (!envCfg)
            throw new Error(`http: endpoint "${endpointName}" has no configuration for env ${env}`);
        const baseHeaders = { ...(envCfg.headers || {}), ...(options?.headers || {}) };
        const request = async (method, path, init) => {
            const url = joinUrl(envCfg.baseUrl, path);
            const headers = new Headers({ ...baseHeaders, ...init?.headers });
            const rInit = { ...init, method, headers };
            return fetch(url, rInit);
        };
        const withJson = (method) => (path, body, init) => request(method, path, asJsonInit(body, init));
        const client = {
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
export const client = { create: (...args) => http(...args) };
// ---- Package.json-based configuration loader ----
import fs from 'fs';
import path from 'path';
/**
 * Loads HTTP client configuration from the consumer project's package.json key:
 * "simple-fake-api-http"
 */
export function loadHttpClientConfigFromPackageJson(customPackageJsonPath) {
    const cwd = process.cwd();
    const packageJsonPath = customPackageJsonPath || path.join(cwd, 'package.json');
    try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const section = pkg['simple-fake-api-http'];
        if (!section) {
            throw new Error('Key "simple-fake-api-http" not found in package.json');
        }
        if (!section.endpoints || typeof section.endpoints !== 'object') {
            throw new Error('Invalid "simple-fake-api-http": missing endpoints');
        }
        return {
            endpoints: section.endpoints,
            resolveEnv: section.resolveEnv,
        };
    }
    catch (e) {
        const msg = `simple-fake-api/http: unable to load configuration from package.json (${e?.message || e})`;
        throw new Error(msg);
    }
}
/**
 * Convenience helper to create the http factory using package.json config.
 * Usage:
 *   import { http } from '@marco-pontes/simple-fake-api/http';
 *   const { create } = http.fromPackageJson();
 */
export function httpFromPackageJson(customPackageJsonPath) {
    const cfg = loadHttpClientConfigFromPackageJson(customPackageJsonPath);
    return http(cfg);
}
// Also expose as a property for ergonomic access
// (typing of this dynamic property is not enforced, but .d.ts will expose the named function)
// @ts-ignore
http.fromPackageJson = (customPackageJsonPath) => http(loadHttpClientConfigFromPackageJson(customPackageJsonPath));
