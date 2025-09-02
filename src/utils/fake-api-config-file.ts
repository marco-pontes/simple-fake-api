import path from 'path';
import fs from 'fs';
import type { SimpleFakeApiConfig } from './types.js';
import { resolveBaseDir, syncRequireModule } from './compatibility.js';
import { createRequire } from 'module';

export type FakeApiConfig = SimpleFakeApiConfig;

export function getConfigCandidatePaths(baseDir?: string): string[] {
  const base = baseDir || resolveBaseDir();
  return [
    path.join(base, 'simple-fake-api.config.js'),
    path.join(base, 'simple-fake-api.config.cjs'),
    path.join(base, 'simple-fake-api.config.mjs'),
    path.join(base, 'simple-fake-api.config.ts'),
    path.join(base, 'simple-fake-api.config.cts'),
  ];
}

export function loadSimpleFakeApiConfigSync(): Partial<FakeApiConfig> | undefined {
  const DEBUG = !!(process && (process.env.SIMPLE_FAKE_API_DEBUG || process.env.SIMPLE_FAKE_API_BUNDLER_DEBUG));
  try {
    const req = createRequire(import.meta.url);
    const candidates = getConfigCandidatePaths();
    if (DEBUG) {
      try {
        const base = candidates[0] ? path.dirname(candidates[0]) : '(unknown)';
        console.log(`simple-fake-api/bundler[debug]: baseDir=${base}`);
        console.log(`simple-fake-api/bundler[debug]: candidates=\n  - ${candidates.join('\n  - ')}`);
      } catch {}
    }
    for (const p of candidates) {
      try {
        const exists = fs.existsSync(p);
        if (DEBUG) {
          try { console.log(`simple-fake-api/bundler[debug]: check exists: ${p} -> ${exists}`); } catch {}
        }
        if (!exists) continue;
        if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: attempting load: ${p}`); } catch {} }
        const cfg = syncRequireModule(p, req) as Partial<FakeApiConfig>;
        if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: loaded OK: ${p}`); } catch {} }
        if (cfg && typeof cfg === 'object') return cfg;
      } catch (e: any) {
        if (DEBUG) {
          try { console.log(`simple-fake-api/bundler[debug]: load failed for ${p}: ${e?.code || ''} ${e?.message || e}`); } catch {}
        }
        continue;
      }
    }
    if (DEBUG) { try { console.log('simple-fake-api/bundler[debug]: no config file loaded (all candidates failed or missing)'); } catch {} }
    return undefined;
  } catch (e: any) {
    if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: unexpected error: ${e?.message || e}`); } catch {} }
    return undefined;
  }
}
