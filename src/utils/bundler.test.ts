import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// We'll import lazily to allow environment setup per test

describe('utils/bundler setupSimpleFakeApiHttpRoutes', () => {
  const prevCwd = process.cwd();
  const prevInit = process.env.INIT_CWD;
  let tmpRoot: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sfa-bundler-'));
  });

  afterEach(() => {
    try { process.chdir(prevCwd); } catch {}
    if (prevInit) process.env.INIT_CWD = prevInit; else delete (process.env as any).INIT_CWD;
    try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
    vi.resetModules();
  });

  it('loads simple-fake-api.config.ts from project root even when cwd is nested (Vite-like)', async () => {
    // Create project root with package.json and TS config file
    fs.writeFileSync(path.join(tmpRoot, 'package.json'), JSON.stringify({ name: 'proj', type: 'module' }), 'utf8');
    const cfgCjs = `module.exports = { port: 5011, apiDir: 'api', collectionsDir: 'collections', wildcardChar: '_', http: { endpoints: { api: { prod: { baseUrl: 'https://x' } } } } }`;
    fs.writeFileSync(path.join(tmpRoot, 'simple-fake-api.config.cjs'), cfgCjs, 'utf8');

    // Simulate IDE/build tool nested cwd: projectRoot/tools/dev
    const nested = path.join(tmpRoot, 'tools', 'dev');
    fs.mkdirSync(nested, { recursive: true });
    process.chdir(nested);
    // Ensure INIT_CWD is unset so resolveBaseDir walks up to nearest package.json
    delete (process.env as any).INIT_CWD;

    // Import subject
    const mod = await import('./bundler');
    const { setupSimpleFakeApiHttpRoutes } = mod as any;

    const defineObj = setupSimpleFakeApiHttpRoutes('development');
    expect(defineObj && typeof defineObj).toBe('object');
    // Should inject __SIMPLE_FAKE_API_HTTP__ with endpoints map (dev computed from port)
    const injected = JSON.parse(defineObj.__SIMPLE_FAKE_API_HTTP__);
    expect(injected.endpoints).toBeDefined();
  });
});
