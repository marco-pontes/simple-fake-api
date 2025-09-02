// Lightweight HTTP client factory with environment-aware base URLs
// Usage in consumer: import { http } from '@marco-pontes/simple-fake-api/http'
// or: import { httpClient } from '@marco-pontes/simple-fake-api'
import { createRequire } from 'module';
/**
 * Resolve current environment name for selecting endpoint configuration.
 * Priority: config.resolveEnv() -> NODE_ENV (prod/staging/test) -> dev
 */
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
/** Join base URL and path, ensuring single slash between. */
const joinUrl = (base, path) => {
    const b = base.replace(/\/$/, '');
    const p = path.replace(/^\//, '');
    return `${b}/${p}`;
};
/** Build RequestInit for JSON body if a plain object/string is provided. */
const asJsonInit = (body, init) => {
    const headers = new Headers(init?.headers || {});
    if (body !== undefined && body !== null && !(body instanceof FormData)) {
        if (!headers.has('content-type'))
            headers.set('content-type', 'application/json');
        return { ...init, headers, body: typeof body === 'string' ? body : JSON.stringify(body) };
    }
    return { ...init, headers, body };
};
/**
 * Create an HTTP client factory bound to the given configuration.
 * Use factory.create(endpointName) to obtain a client with helpers for HTTP verbs.
 */
// Internal builder to create a client from a resolved config
const buildFactory = (config, defaultBaseUrl) => {
    const env = pickEnv(config);
    function create(endpointName, options) {
        const def = config.endpoints[endpointName];
        let envCfg;
        if (!def) {
            // No declaration for this endpoint; use defaultBaseUrl if provided (e.g., from localhost:port fallback)
            if (defaultBaseUrl) {
                envCfg = { baseUrl: defaultBaseUrl };
            }
            else {
                throw new Error(`http: endpoint "${endpointName}" not found`);
            }
        }
        else if (def && typeof def === 'object' && 'baseUrl' in def) {
            // Flattened shape injected by new bundler plugin
            envCfg = { baseUrl: def.baseUrl, headers: def.headers };
        }
        else {
            envCfg = def[env] || def[def.default || 'dev'];
            if (!envCfg)
                throw new Error(`http: endpoint "${endpointName}" has no configuration for env ${env}`);
        }
        const baseHeaders = { ...(envCfg.headers || {}), ...(options?.headers || {}) };
        const request = async (method, path, init) => {
            const url = joinUrl(envCfg.baseUrl, path);
            // Merge baseHeaders with any provided init.headers. Use Headers API to preserve existing values
            const headers = new Headers(baseHeaders);
            if (init?.headers) {
                new Headers(init.headers).forEach((value, key) => headers.set(key, value));
            }
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
function resolveInjectedConfig() {
    try {
        // Value should be injected at build time by bundlers using the helper in bundler subpath (@marco-pontes/simple-fake-api/bundler)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGlobal = (typeof globalThis !== 'undefined') ? globalThis : {};
        return anyGlobal.__SIMPLE_FAKE_API_HTTP__;
    }
    catch {
        return undefined;
    }
}
export function create(endpointName, options) {
    // 1) Prefer build-time injected config for browser/runtime without FS
    const injected = resolveInjectedConfig();
    if (injected && injected.endpoints) {
        const factory = buildFactory(injected);
        return factory.create(endpointName, options);
    }
    // 2) Node/dev: fallback to localhost:<port> from simple-fake-api.config.* (synchronous load in Node only)
    const nodePort = (() => {
        try {
            // Avoid bundlers: only attempt in real Node
            // @ts-ignore
            const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
            if (!isNode)
                return undefined;
            // Lazy, inline sync load of config file to obtain the port (avoid hard dependency for browser bundles)
            const req = createRequire(import.meta.url);
            const fs = req('fs');
            const path = req('path');
            const initCwd = process.env.INIT_CWD;
            const baseDir = initCwd && fs.existsSync(path.join(initCwd, 'package.json')) ? initCwd : process.cwd();
            const candidates = [
                path.join(baseDir, 'simple-fake-api.config.js'),
                path.join(baseDir, 'simple-fake-api.config.cjs'),
                path.join(baseDir, 'simple-fake-api.config.mjs'),
                path.join(baseDir, 'simple-fake-api.config.ts'),
                path.join(baseDir, 'simple-fake-api.config.cts'),
            ];
            for (const p of candidates) {
                if (!fs.existsSync(p))
                    continue;
                const ext = path.extname(p);
                try {
                    if (ext === '.ts' || ext === '.cts') {
                        try {
                            // Prefer programmatic ts-node registration for robust CJS require of TS files
                            try {
                                const tsnode = req('ts-node');
                                if (tsnode && typeof tsnode.register === 'function') {
                                    tsnode.register({ transpileOnly: true, compilerOptions: { module: 'commonjs', esModuleInterop: true } });
                                }
                                else {
                                    try {
                                        req.resolve('ts-node/register/transpile-only');
                                        req('ts-node/register/transpile-only');
                                    }
                                    catch {
                                        try {
                                            req.resolve('ts-node/register');
                                            req('ts-node/register');
                                        }
                                        catch { }
                                    }
                                }
                            }
                            catch { }
                        }
                        catch { }
                        const mod = req(p);
                        const cfg = mod && (mod.default ?? mod);
                        if (cfg?.port)
                            return cfg.port;
                    }
                    else {
                        const mod = req(p);
                        const cfg = mod && (mod.default ?? mod);
                        if (cfg?.port)
                            return cfg.port;
                    }
                }
                catch {
                    continue;
                }
            }
            return undefined;
        }
        catch {
            return undefined;
        }
    })();
    if (nodePort) {
        const factory = buildFactory({ endpoints: {} }, `http://localhost:${nodePort}`);
        return factory.create(endpointName, options);
    }
    // Last resort: error
    throw new Error('simple-fake-api/http: no configuration provided. Provide build-time config via setupSimpleFakeApiHttpRoutes in your bundler or inject __SIMPLE_FAKE_API_HTTP__');
}
