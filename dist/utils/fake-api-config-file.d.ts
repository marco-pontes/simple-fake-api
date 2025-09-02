import type { SimpleFakeApiConfig } from './types.js';
export type FakeApiConfig = SimpleFakeApiConfig;
export declare function getConfigCandidatePaths(baseDir?: string): string[];
export declare function loadSimpleFakeApiConfigSync(): Partial<FakeApiConfig> | undefined;
