import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';


// Import subject
import { create } from './http-client';

const originalEnv = { ...process.env };
let fetchSpy: any;

describe('http-client', () => {
  beforeEach(() => {
    process.env = { ...originalEnv } as any;
    fetchSpy = vi.fn(async () => ({ ok: true, status: 200 } as any));
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
    const client = create('api');
    await client.get('/users');
    expect(fetchSpy).toHaveBeenCalledWith('http://injected/users', expect.objectContaining({ method: 'GET' }));
    // cleanup
    // @ts-ignore
    delete globalThis.__SIMPLE_FAKE_API_HTTP__;
  });

  it('falls back to localhost:port from injected server config when no HTTP injection', async () => {
    // @ts-ignore
    globalThis.__SIMPLE_FAKE_API_CONFIG__ = { port: 5051, apiDir: 'api', collectionsDir: 'collections', wildcardChar: '_' };
    // Ensure no HTTP injection
    // @ts-ignore
    delete globalThis.__SIMPLE_FAKE_API_HTTP__;

    const client = create('anything');
    await client.get('/ping');
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:5051/ping', expect.objectContaining({ method: 'GET' }));

    // cleanup
    // @ts-ignore
    delete globalThis.__SIMPLE_FAKE_API_CONFIG__;
  });


  it('throws helpful error when neither HTTP injection nor injected port present', async () => {
    // Ensure no globals are set
    // @ts-ignore
    delete globalThis.__SIMPLE_FAKE_API_HTTP__;
    // @ts-ignore
    delete globalThis.__SIMPLE_FAKE_API_CONFIG__;
    expect(() => create('missing')).toThrow(
      'simple-fake-api/http: no configuration provided. Provide build-time config via setupSimpleFakeApiHttpRoutes in your bundler or inject __SIMPLE_FAKE_API_HTTP__',
    );
  });

  it('json helpers set content-type for post/put/patch', async () => {
    // Use injected base
    // @ts-ignore
    globalThis.__SIMPLE_FAKE_API_HTTP__ = { endpoints: { api: { dev: { baseUrl: 'http://injected' } } } };
    delete process.env.NODE_ENV;
    const client = create('api');
    await client.post('/a', { a: 1 });
    await client.put('/b', { b: 2 });
    await client.patch('/c', { c: 3 });
    for (let i = 0; i < 3; i++) {
      const [, init] = fetchSpy.mock.calls[i];
      const headers = new Headers((init as any).headers);
      expect(headers.get('content-type')).toBe('application/json');
    }
    // @ts-ignore
    delete globalThis.__SIMPLE_FAKE_API_HTTP__;
  });

  it('throws when endpoint name not found under injected config', async () => {
    // @ts-ignore
    globalThis.__SIMPLE_FAKE_API_HTTP__ = { endpoints: { known: { baseUrl: 'http://x' } } };
    expect(() => create('missing')).toThrow(/endpoint "missing" not found/);
    // @ts-ignore
    delete globalThis.__SIMPLE_FAKE_API_HTTP__;
  });
});
