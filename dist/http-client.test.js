import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// We will dynamically import the subject in tests to allow mocking internals
const originalEnv = { ...process.env };
let fetchSpy;
describe('http-client', () => {
    beforeEach(() => {
        process.env = { ...originalEnv };
        fetchSpy = vi.fn(async () => ({ ok: true, status: 200 }));
        // @ts-ignore
        global.fetch = fetchSpy;
    });
    afterEach(() => {
        process.env = originalEnv;
        vi.restoreAllMocks();
    });
    it('uses injected config when provided', async () => {
        // simulate bundler injection with env-style mapping
        // @ts-ignore
        globalThis.__SIMPLE_FAKE_API_HTTP__ = { endpoints: { api: { dev: { baseUrl: 'http://injected' } } } };
        delete process.env.NODE_ENV; // ensure dev
        const { create } = await import('./http-client');
        const client = create('api');
        await client.get('/users');
        expect(fetchSpy).toHaveBeenCalledWith('http://injected/users', expect.objectContaining({ method: 'GET' }));
        // cleanup
        // @ts-ignore
        delete globalThis.__SIMPLE_FAKE_API_HTTP__;
    });
    it('falls back to localhost:port from config file when no HTTP injection (Node only)', async () => {
        // Ensure no HTTP injection
        // @ts-ignore
        delete globalThis.__SIMPLE_FAKE_API_HTTP__;
        // Create a temporary project root with a config file
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfa-'));
        const prevCwd = process.cwd();
        const prevInitCwd = process.env.INIT_CWD;
        delete process.env.INIT_CWD;
        process.chdir(tmpDir);
        // Write CommonJS config file
        fs.writeFileSync(path.join(tmpDir, 'simple-fake-api.config.cjs'), "module.exports = { port: 5051, apiDir: 'api', collectionsDir: 'collections', wildcardChar: '_' }", 'utf8');
        try {
            vi.resetModules();
            const { create: createClient } = await import('./http-client');
            const client = createClient('anything');
            await client.get('/ping');
            expect(fetchSpy).toHaveBeenCalledWith('http://localhost:5051/ping', expect.objectContaining({ method: 'GET' }));
        }
        finally {
            process.chdir(prevCwd);
            if (prevInitCwd)
                process.env.INIT_CWD = prevInitCwd;
            else
                delete process.env.INIT_CWD;
            try {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
            catch { }
        }
    });
    it('throws helpful error when neither HTTP injection nor config file present', async () => {
        // Ensure no globals are set
        // @ts-ignore
        delete globalThis.__SIMPLE_FAKE_API_HTTP__;
        vi.resetModules();
        vi.doMock('./utils/fake-api-config-file', () => ({
            loadSimpleFakeApiConfigSync: () => undefined,
        }));
        const { create: createClient } = await import('./http-client');
        expect(() => createClient('missing')).toThrow('simple-fake-api/http: no configuration provided. Provide build-time config via setupSimpleFakeApiHttpRoutes in your bundler or inject __SIMPLE_FAKE_API_HTTP__');
    });
    it('json helpers set content-type for post/put/patch', async () => {
        // Use injected base
        // @ts-ignore
        globalThis.__SIMPLE_FAKE_API_HTTP__ = { endpoints: { api: { dev: { baseUrl: 'http://injected' } } } };
        delete process.env.NODE_ENV;
        const { create } = await import('./http-client');
        const client = create('api');
        await client.post('/a', { a: 1 });
        await client.put('/b', { b: 2 });
        await client.patch('/c', { c: 3 });
        for (let i = 0; i < 3; i++) {
            const [, init] = fetchSpy.mock.calls[i];
            const headers = new Headers(init.headers);
            expect(headers.get('content-type')).toBe('application/json');
        }
        // @ts-ignore
        delete globalThis.__SIMPLE_FAKE_API_HTTP__;
    });
    it('throws when endpoint name not found under injected config', async () => {
        // @ts-ignore
        globalThis.__SIMPLE_FAKE_API_HTTP__ = { endpoints: { known: { baseUrl: 'http://x' } } };
        const { create } = await import('./http-client');
        expect(() => create('missing')).toThrow(/endpoint "missing" not found/);
        // @ts-ignore
        delete globalThis.__SIMPLE_FAKE_API_HTTP__;
    });
});
