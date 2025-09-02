import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import fs from 'fs';
import path from 'path';

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

  it('falls back to localhost:port from package.json when no injection', async () => {
    // mock reading package.json for port via explicit path
    const pkgPath = '/tmp/pkg.json';
    vi.spyOn(fs, 'readFileSync').mockImplementation((p: any) => {
      if (p === pkgPath) return JSON.stringify({ 'simple-fake-api-config': { port: 5050 } });
      throw new Error('unexpected read');
    });

    const client = create('anything', undefined, pkgPath);
    await client.get('/ping');
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:5050/ping', expect.objectContaining({ method: 'GET' }));
  });

  it('throws helpful error when neither injection nor port present', async () => {
    const cwd = '/tmp/project2';
    vi.spyOn(process, 'cwd').mockReturnValue(cwd as any);
    vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => { throw new Error('no file'); });
    expect(() => create('missing')).toThrow(/no configuration provided/i);
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
