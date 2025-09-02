import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

import type { SimpleFakeApiConfig } from './types.js';

// Synchronous loader for simple-fake-api.config.* used by the CLI/server and Node fallbacks.
// Supports .js/.cjs ESM/CJS and .ts/.cts via ts-node when available in the consumer project.
export function loadSimpleFakeApiConfigSync(): Partial<SimpleFakeApiConfig> | undefined {
  try {
    const initCwd = process.env.INIT_CWD;
    const baseDir = initCwd && fs.existsSync(path.join(initCwd, 'package.json')) ? initCwd : process.cwd();
    const candidates = [
      path.join(baseDir, 'simple-fake-api.config.js'),
      path.join(baseDir, 'simple-fake-api.config.cjs'),
      path.join(baseDir, 'simple-fake-api.config.mjs'),
      path.join(baseDir, 'simple-fake-api.config.ts'),
      path.join(baseDir, 'simple-fake-api.config.cts'),
    ];

    const req = createRequire(import.meta.url);

    for (const p of candidates) {
      if (!fs.existsSync(p)) continue;
      const ext = path.extname(p);
      try {
        if (ext === '.ts' || ext === '.cts') {
          try { (req as any).resolve('ts-node/register'); (req as any)('ts-node/register'); } catch {}
          const mod = req(p);
          return (mod && (mod.default ?? mod)) as Partial<SimpleFakeApiConfig>;
        }
        if (ext === '.js' || ext === '.cjs') {
          const mod = req(p);
          return (mod && (mod.default ?? mod)) as Partial<SimpleFakeApiConfig>;
        }
        if (ext === '.mjs') {
          // We avoid async import; try requiring .mjs via createRequire if transpiled to CJS by the user
          try {
            const mod = req(p);
            return (mod && (mod.default ?? mod)) as Partial<SimpleFakeApiConfig>;
          } catch {
            // Unsupported ESM-only .mjs in sync context
            continue;
          }
        }
      } catch {
        // Try next candidate
        continue;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}
