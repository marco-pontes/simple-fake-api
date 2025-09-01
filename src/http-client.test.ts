import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the pkg util for the specific tests that use fromPackageJson
vi.mock('./utils/pkg.js', async () => {
  const readSimpleFakeApiHttpConfig = vi.fn(() => ({
    endpoints: {
      'api': {
        dev: { baseUrl: 'http://dev.example' },
        prod: { baseUrl: 'https://prod.example' },
      },
    },
  }));
  const loadHttpClientConfigFromPackageJson = () => {
    const section: any = readSimpleFakeApiHttpConfig();
    if (!section || !section.endpoints) {
      throw new Error('Key "simple-fake-api-config.http" not found in package.json');
    }
    return { endpoints: section.endpoints } as any;
  };
  return {
    readSimpleFakeApiHttpConfig,
    loadHttpClientConfigFromPackageJson,
  };
});

// Import after mocks
import { create } from './http-client';
import { loadHttpClientConfigFromPackageJson } from './utils/pkg.js';

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

  it('uses dev by default when NODE_ENV not set', async () => {
    delete process.env.NODE_ENV;
    // Simulate config via package.json by mocking loader
    const mod = await import('./utils/pkg.js');
    (mod as any).readSimpleFakeApiHttpConfig.mockReturnValueOnce({
      endpoints: { api: { dev: { baseUrl: 'http://localhost:5000' }, prod: { baseUrl: 'https://prod' } } },
    });

    const client = create('api');
    await client.get('/users');
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:5000/users', expect.objectContaining({ method: 'GET' }));
  });

  it('picks prod when NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';
    const mod = await import('./utils/pkg.js');
    (mod as any).readSimpleFakeApiHttpConfig.mockReturnValueOnce({
      endpoints: { api: { dev: { baseUrl: 'http://dev' }, prod: { baseUrl: 'https://prod' } } },
    });
    const client = create('api');
    await client.get('/ping');
    expect(fetchSpy).toHaveBeenCalledWith('https://prod/ping', expect.objectContaining({ method: 'GET' }));
  });

  it('merges headers from env config and per-client options', async () => {
    const mod = await import('./utils/pkg');
    (mod as any).readSimpleFakeApiHttpConfig.mockReturnValueOnce({
      endpoints: { api: { dev: { baseUrl: 'http://dev', headers: { Authorization: 'Bearer A' } } } },
    });
    const client = create('api', { headers: { 'X-Trace': 't1' } });
    await client.get('/r');
    const [, init] = fetchSpy.mock.calls[0];
    const headers = new Headers((init as any).headers);
    expect(headers.get('Authorization')).toBe('Bearer A');
    expect(headers.get('X-Trace')).toBe('t1');
  });

  it('post/put/patch use JSON content-type when body is object', async () => {
    const mod = await import('./utils/pkg.js');
    (mod as any).readSimpleFakeApiHttpConfig.mockReturnValueOnce({ endpoints: { api: { dev: { baseUrl: 'http://dev' } } } });
    const client = create('api');

    await client.post('/users', { a: 1 });
    await client.put('/users/1', { b: 2 });
    await client.patch('/users/1', { c: 3 });

    for (let i = 0; i < 3; i++) {
      const [, init] = fetchSpy.mock.calls[i];
      const headers = new Headers((init as any).headers);
      expect(headers.get('content-type')).toBe('application/json');
      expect((init as any).body).toEqual(expect.any(String));
    }
  });

  it('throws when endpoint name not found', async () => {
    const mod = await import('./utils/pkg.js');
    (mod as any).readSimpleFakeApiHttpConfig.mockReturnValueOnce({ endpoints: {} });
    expect(() => create('missing')).toThrow(/endpoint "missing" not found/);
  });

  it('create loads config via pkg util and creates client', async () => {
    const client = create('api');
    await client.get('/ok');
    expect(fetchSpy).toHaveBeenCalledWith('http://dev.example/ok', expect.any(Object));
  });

  it('loadHttpClientConfigFromPackageJson throws when section missing', async () => {
    // remock to return undefined
    const mod = await import('./utils/pkg.js');
    (mod as any).readSimpleFakeApiHttpConfig.mockReturnValueOnce(undefined);
    expect(() => loadHttpClientConfigFromPackageJson()).toThrow(/not found/);
  });
});
