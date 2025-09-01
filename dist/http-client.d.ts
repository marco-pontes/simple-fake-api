import type { HttpClientConfig, CreateOptions, Client } from './types.js';
/**
 * Create an HTTP client factory bound to the given configuration.
 * Use factory.create(endpointName) to obtain a client with helpers for HTTP verbs.
 */
export declare const http: (config: HttpClientConfig) => {
    create: (endpointName: string, options?: CreateOptions) => Client;
};
export declare const client: any;
/**
 * Loads HTTP client configuration from the consumer project's package.json key:
 * "simple-fake-api-config.http" (http client config nested under the main simple-fake-api-config)
 */
/**
 * Load HTTP client configuration from the consumer project's package.json key:
 * simple-fake-api-config.http (nested under the main simple-fake-api-config section).
 */
export declare function loadHttpClientConfigFromPackageJson(customPackageJsonPath?: string): HttpClientConfig;
/**
 * Convenience helper to create the http factory using package.json config.
 * Usage:
 *   import { http } from '@marco-pontes/simple-fake-api/http';
 *   const { create } = http.fromPackageJson();
 */
/** Convenience helper to create the http factory using package.json config. */
export declare function httpFromPackageJson(customPackageJsonPath?: string): {
    create: (endpointName: string, options?: CreateOptions) => Client;
};
