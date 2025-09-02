import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

/** Determine if we are running in a real Node.js runtime (not a bundled browser env). */
export function isNodeRuntime(): boolean {
  try {
    // @ts-ignore
    return typeof process !== 'undefined' && !!(process.versions && process.versions.node);
  } catch {
    return false;
  }
}

/** Resolve the base directory to locate consumer project files (INIT_CWD preferred). */
export function resolveBaseDir(): string {
  try {
    const initCwd = process.env.INIT_CWD;
    if (initCwd && fs.existsSync(path.join(initCwd, 'package.json'))) return initCwd;
  } catch {}
  try {
    return process.cwd();
  } catch {
    return '.';
  }
}

/**
 * Try to register ts-node so that requiring .ts/.cts files works synchronously.
 * Prefers programmatic tsnode.register({ transpileOnly: true }) and falls back to register modules.
 * It never throws; best-effort only.
 */
export function tryRegisterTsNode(req?: NodeRequire): void {
  try {
    const r = req || createRequire(import.meta.url);
    try {
      const tsnode = (r as any)('ts-node');
      if (tsnode && typeof tsnode.register === 'function') {
        tsnode.register({ transpileOnly: true, compilerOptions: { module: 'commonjs', esModuleInterop: true } });
        return;
      }
    } catch {}
    // Fallback to legacy register modules
    try { (r as any).resolve('ts-node/register/transpile-only'); (r as any)('ts-node/register/transpile-only'); return; } catch {}
    try { (r as any).resolve('ts-node/register'); (r as any)('ts-node/register'); return; } catch {}
  } catch {
    // ignore
  }
}

/** Require a module path synchronously and return default export if present; supports TS via ts-node. */
export function syncRequireModule(filePath: string, req?: NodeRequire): any {
  const r = req || createRequire(import.meta.url);
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.ts' || ext === '.cts') {
    tryRegisterTsNode(r);
  }
  const mod = (r as any)(filePath);
  return mod && (mod.default ?? mod);
}
