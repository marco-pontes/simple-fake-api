import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
// Synchronous loader for simple-fake-api.config.* used by the CLI/server and Node fallbacks.
// Supports .js/.cjs ESM/CJS and .ts/.cts via ts-node when available in the consumer project.
export function loadSimpleFakeApiConfigSync() {
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
            if (!fs.existsSync(p))
                continue;
            const ext = path.extname(p);
            try {
                if (ext === '.ts' || ext === '.cts') {
                    try {
                        // Prefer programmatic ts-node registration for robust CJS require of TS files
                        try {
                            const tsnode = req('ts-node');
                            if (tsnode && typeof tsnode.register === 'function') {
                                tsnode.register({ transpileOnly: true, compilerOptions: { module: 'commonjs', esModuleInterop: true } });
                            }
                            else {
                                try {
                                    req.resolve('ts-node/register/transpile-only');
                                    req('ts-node/register/transpile-only');
                                }
                                catch {
                                    try {
                                        req.resolve('ts-node/register');
                                        req('ts-node/register');
                                    }
                                    catch {
                                        console.warn('simple-fake-api: ts-node not found while loading TypeScript config. .ts config may fail to load.');
                                    }
                                }
                            }
                        }
                        catch { }
                    }
                    catch { }
                    const mod = req(p);
                    return (mod && (mod.default ?? mod));
                }
                if (ext === '.js' || ext === '.cjs') {
                    const mod = req(p);
                    return (mod && (mod.default ?? mod));
                }
                if (ext === '.mjs') {
                    // We avoid async import; try requiring .mjs via createRequire if transpiled to CJS by the user
                    try {
                        const mod = req(p);
                        return (mod && (mod.default ?? mod));
                    }
                    catch {
                        // Unsupported ESM-only .mjs in sync context
                        continue;
                    }
                }
            }
            catch {
                // Try next candidate
                continue;
            }
        }
        return undefined;
    }
    catch {
        return undefined;
    }
}
