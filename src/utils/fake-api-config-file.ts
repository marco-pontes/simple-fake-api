import path from 'path';
import fs from 'fs';
import type { SimpleFakeApiConfig } from './types.js';
import { resolveBaseDir, syncRequireModule } from './compatibility.js';
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
        if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: attempting load: ${p} (ext=${ext}, projectType=${projectType})`); } catch {} }
        // Loading rules
        // - .cjs: always require
        // - .mjs: try require (works if transpiled to CJS), otherwise skip (no async import here)
        // - .cts: register ts-node, then require
        // - .ts: register ts-node, then require; if ERR_REQUIRE_ESM under ESM project, try TypeScript transpile fallback
        // - .js: require when projectType !== 'module'; if 'module', require may throw ERR_REQUIRE_ESM
        let cfg: any;
        if (ext === '.cjs') {
          cfg = syncRequireModule(p, req);
        } else if (ext === '.mjs') {
          try {
            cfg = syncRequireModule(p, req);
          } catch (e: any) {
            if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: require failed for .mjs (${p}): ${e?.code || ''} ${e?.message || e}`); } catch {} }
            continue;
          }
        } else if (ext === '.cts') {
          cfg = syncRequireModule(p, req);
        } else if (ext === '.ts') {
          try {
            cfg = syncRequireModule(p, req);
          } catch (e: any) {
            if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: primary load failed for .ts (${p}): ${e?.code || ''} ${e?.message || e}`); } catch {} }
            // Fallback: attempt to transpile with consumer's TypeScript to CommonJS and require the temp file (ESM-friendly)
            try {
              const ts = (req as any)('typescript');
              if (ts && typeof ts.transpileModule === 'function') {
                const src = fs.readFileSync(p, 'utf8');
                const out = ts.transpileModule(src, {
                  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2019 },
                  fileName: p,
                });
                const os = (req as any)('os') as typeof import('os');
                const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfa-cfg-'));
                const tmpFile = path.join(tmpDir, path.basename(p).replace(/\.ts$/, '.cjs'));
                fs.writeFileSync(tmpFile, out.outputText, 'utf8');
                if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: transpiled TS config to temp CJS: ${tmpFile}`); } catch {} }
                const mod = (req as any)(tmpFile);
                cfg = mod && (mod.default ?? mod);
                // best-effort cleanup
                try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
              } else {
                if (DEBUG) { try { console.log('simple-fake-api/bundler[debug]: typescript not available for transpile fallback'); } catch {} }
              }
            } catch (e2: any) {
              if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: transpile fallback failed: ${e2?.code || ''} ${e2?.message || e2}`); } catch {} }
            }
          }
        } else if (ext === '.js') {
          try {
            cfg = syncRequireModule(p, req);
          } catch (e: any) {
            if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: require failed for .js (${p}): ${e?.code || ''} ${e?.message || e}`); } catch {} }
            continue;
          }
        }
        if (cfg && typeof cfg === 'object') {
          if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: loaded OK: ${p}`); } catch {} }
          return cfg as Partial<FakeApiConfig>;
        }
      } catch (e: any) {
        if (DEBUG) { try { console.log(`simple-fake-api/bundler[debug]: load failed for ${p}: ${e?.code || ''} ${e?.message || e}`); } catch {} }
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
