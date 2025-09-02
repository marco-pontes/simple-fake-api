import { loadFastApiConfigSync } from './fake-api-config-file.js';
// Backwards-compatible re-export used internally by server/config
export function loadSimpleFakeApiConfigSync() {
    return loadFastApiConfigSync();
}
