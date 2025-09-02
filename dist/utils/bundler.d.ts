import type { SimpleFakeApiConfig } from './types.js';
export interface InjectedHttpConfig {
    endpoints: Record<string, {
        baseUrl: string;
        headers?: Record<string, string>;
    }>;
}
export declare function setupSimpleFakeApiHttpRoutes(environment: string): Record<string, any>;
export type { SimpleFakeApiConfig };
