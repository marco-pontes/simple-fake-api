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
  try {
    const req = createRequire(import.meta.url);
    const candidates = getConfigCandidatePaths();
    for (const p of candidates) {
      try {
        if (!fs.existsSync(p)) continue;
        const cfg = syncRequireModule(p, req) as Partial<FakeApiConfig>;
        if (cfg && typeof cfg === 'object') return cfg;
      } catch {
        continue;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}
