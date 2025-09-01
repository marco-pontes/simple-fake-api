import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the pkg util for the specific tests that use fromPackageJson
vi.mock('./utils/pkg', async () => {
  return {
    readSimpleFakeApiHttpConfig: vi.fn(() => ({
      endpoints: {
        'api': {
          dev: { baseUrl: 'http://dev.example' },
          prod: { baseUrl: 'https://prod.example' },
        },
      },
    })),
  };
});

// Import after mocks
import { http, httpFromPackageJson, loadHttpClientConfigFromPackageJson } from './http-client';

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
    const cfg = {
      endpoints: {
        api: {
          dev: { baseUrl: 'http://localhost:5000' },
          prod: { baseUrl: 'https://prod' },
        },
      },
    } as const;

    const { create } = http(cfg as any);
    const client = create('api');
    await client.get('/users');
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:5000/users', expect.objectContaining({ method: 'GET' }));
  });

  it('picks prod when NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';
    const cfg = {
      endpoints: {
        api: {
          dev: { baseUrl: 'http://dev' },
          prod: { baseUrl: 'https://prod' },
        },
      },
    };
    const client = http(cfg as any).create('api');
    await client.get('/ping');
    expect(fetchSpy).toHaveBeenCalledWith('https://prod/ping', expect.objectContaining({ method: 'GET' }));
  });

  it('merges headers from env config and per-client options', async () => {
    const cfg = {
      endpoints: {
        api: {
          dev: { baseUrl: 'http://dev', headers: { Authorization: 'Bearer A' } },
        },
      },
    };
    const client = http(cfg as any).create('api', { headers: { 'X-Trace': 't1' } });
    await client.get('/r');
    const [, init] = fetchSpy.mock.calls[0];
    const headers = new Headers((init as any).headers);
    expect(headers.get('Authorization')).toBe('Bearer A');
    expect(headers.get('X-Trace')).toBe('t1');
  });

  it('post/put/patch use JSON content-type when body is object', async () => {
    const cfg = { endpoints: { api: { dev: { baseUrl: 'http://dev' } } } };
    const client = http(cfg as any).create('api');

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

  it('throws when endpoint name not found', () => {
    const cfg = { endpoints: {} } as any;
    const factory = http(cfg);
    expect(() => factory.create('missing')).toThrow(/endpoint "missing" not found/);
  });

  it('httpFromPackageJson loads config via pkg util and creates client', async () => {
    const factory = httpFromPackageJson();
    const client = factory.create('api');
    await client.get('/ok');
    expect(fetchSpy).toHaveBeenCalledWith('http://dev.example/ok', expect.any(Object));
  });

  it('loadHttpClientConfigFromPackageJson throws when section missing', async () => {
    // remock to return undefined
    const mod = await import('./utils/pkg');
    mod.readSimpleFakeApiHttpConfig.mockReturnValueOnce(undefined);
    expect(() => loadHttpClientConfigFromPackageJson()).toThrow(/not found/);
  });
});
