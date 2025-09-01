export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export interface EndpointConfig {
    baseUrl: string;
    headers?: Record<string, string>;
}
export interface HttpClientConfig {
    endpoints: Record<string, {
        dev: EndpointConfig;
        prod?: EndpointConfig;
        staging?: EndpointConfig;
        test?: EndpointConfig;
        default?: keyof EnvironmentMap;
    }>;
    resolveEnv?: () => keyof EnvironmentMap;
}
export type Environment = 'dev' | 'prod' | 'staging' | 'test';
export type EnvironmentMap = Record<Environment, EndpointConfig>;
export interface CreateOptions {
    headers?: Record<string, string>;
}
export interface Client {
    get: (path: string, init?: RequestInit) => Promise<Response>;
    post: (path: string, body?: any, init?: RequestInit) => Promise<Response>;
    put: (path: string, body?: any, init?: RequestInit) => Promise<Response>;
    patch: (path: string, body?: any, init?: RequestInit) => Promise<Response>;
    delete: (path: string, init?: RequestInit) => Promise<Response>;
    head: (path: string, init?: RequestInit) => Promise<Response>;
    options: (path: string, init?: RequestInit) => Promise<Response>;
    request: (method: HttpMethod, path: string, init?: RequestInit) => Promise<Response>;
    baseUrl: string;
    headers: Record<string, string>;
}
export declare const http: (config: HttpClientConfig) => {
    create: (endpointName: string, options?: CreateOptions) => Client;
};
export declare const client: any;
/**
 * Loads HTTP client configuration from the consumer project's package.json key:
 * "simple-fake-api-config.http" (http client config nested under the main simple-fake-api-config)
 */
export declare function loadHttpClientConfigFromPackageJson(customPackageJsonPath?: string): HttpClientConfig;
/**
 * Convenience helper to create the http factory using package.json config.
 * Usage:
 *   import { http } from '@marco-pontes/simple-fake-api/http';
 *   const { create } = http.fromPackageJson();
 */
export declare function httpFromPackageJson(customPackageJsonPath?: string): {
    create: (endpointName: string, options?: CreateOptions) => Client;
};
