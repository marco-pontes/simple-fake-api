import type { SimpleFakeApiConfig } from './types.js';
import { loadSimpleFakeApiConfigSync as loadFromFile } from './fake-api-config-file.js';

// Backwards-compatible re-export used internally by server/config
export function loadSimpleFakeApiConfigSync(): Partial<SimpleFakeApiConfig> | undefined {
  return loadFromFile();
}
