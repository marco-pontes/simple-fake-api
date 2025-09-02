import path from 'path';
import fs from 'fs';
import { resolveBaseDir, syncRequireModule } from './compatibility.js';
import { createRequire } from 'module';
export function getConfigCandidatePaths(baseDir) {
    const base = baseDir || resolveBaseDir();
    return [
        path.join(base, 'simple-fake-api.config.js'),
        path.join(base, 'simple-fake-api.config.cjs'),
        path.join(base, 'simple-fake-api.config.mjs'),
        path.join(base, 'simple-fake-api.config.ts'),
        path.join(base, 'simple-fake-api.config.cts'),
    ];
}
export function loadFastApiConfigSync() {
    try {
        const req = createRequire(import.meta.url);
        const candidates = getConfigCandidatePaths();
        for (const p of candidates) {
            try {
                if (!fs.existsSync(p))
                    continue;
                const cfg = syncRequireModule(p, req);
                if (cfg && typeof cfg === 'object')
                    return cfg;
            }
            catch {
                continue;
            }
        }
        return undefined;
    }
    catch {
        return undefined;
    }
}
