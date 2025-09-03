import path from 'path';
import fs from 'fs';
import type { SimpleFakeApiConfig } from './types.js';
import { resolveBaseDir } from './compatibility.js';
import { createRequire } from 'module';

export type FakeApiConfig = SimpleFakeApiConfig;

function detectProjectModuleType(baseDir: string): 'module' | 'commonjs' {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(baseDir, 'package.json'), 'utf8'));
    return pkg && pkg.type === 'module' ? 'module' : 'commonjs';
  } catch {
    return 'commonjs';
  }
}

export function getConfigCandidatePaths(baseDir?: string): string[] {
  const base = baseDir || resolveBaseDir();
  // Order per spec: start with explicit extensions to remove ambiguity, then TS, then fallback js
  return [
    path.join(base, 'simple-fake-api.config.cjs'),
    path.join(base, 'simple-fake-api.config.mjs'),
    path.join(base, 'simple-fake-api.config.cts'),
    path.join(base, 'simple-fake-api.config.ts'),
    path.join(base, 'simple-fake-api.config.js'),
  ];
}

export function loadSimpleFakeApiConfigSync(): Partial<FakeApiConfig> | undefined {
  const DEBUG = !!(process && (process.env.SIMPLE_FAKE_API_DEBUG || process.env.SIMPLE_FAKE_API_BUNDLER_DEBUG));
  try {
    const req = createRequire(import.meta.url);
    // Initialize jiti with our require context; prefer ESM default interop
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jiti = (req as any)('jiti')(__filename, { interopDefault: true, esmResolve: true, cache: false });
    const base = resolveBaseDir();
    const projectType = detectProjectModuleType(base);
    const candidates = getConfigCandidatePaths(base);
    if (DEBUG) {
      try {
        console.log(`simple-fake-api/bundler[debug]: baseDir=${base}`);
        console.log(`simple-fake-api/bundler[debug]: package.json type=${projectType}`);
        console.log(`simple-fake-api/bundler[debug]: candidates=\n  - ${candidates.join('\n  - ')}`);
      } catch {}
    }
    for (const p of candidates) {
      try {
        const exists = fs.existsSync(p);
        if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: check exists: ${p} -> ${exists}`); } catch {} }
        if (!exists) continue;
        const ext = path.extname(p).toLowerCase();
        if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: attempting load (jiti): ${p} (ext=${ext}, projectType=${projectType})`); } catch {} }
        const mod = jiti(p);
        const cfg = mod && (mod.default ?? mod);
        if (cfg && typeof cfg === 'object') {
          if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: loaded OK via jiti: ${p}`); } catch {} }
          return cfg as Partial<FakeApiConfig>;
        }
      } catch (e: any) {
        if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: load failed for ${p} (jiti): ${e?.code || ''} ${e?.message || e}`); } catch {} }
        continue;
      }
    }
    if (DEBUG) { try { console.log('simple-fake-api/bundler[debug]: no config file loaded (all candidates failed or missing)'); } catch {} }
    return undefined;
  } catch (e: any) {
    if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: unexpected error (jiti): ${e?.message || e}`); } catch {} }
    return undefined;
  }
}
