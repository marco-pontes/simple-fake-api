// Utilities to help consumers inject HTTP client configuration at build time via bundlers
// The library's http-client will read from a global __SIMPLE_FAKE_API_HTTP__ if defined.
// Use the helper below in Vite or Webpack to create that definition from a config object you construct in your bundler config.

export interface InjectedHttpConfig {
  endpoints: Record<string, { baseUrl: string; headers?: Record<string, string> }>;
}

// Helper to generate a define map for bundlers from a direct config object
// Vite example:
//   import { defineConfig } from 'vite';
//   import { setupSimpleFakeApiHttpRoutes } from '@marco-pontes/simple-fake-api/bundler';
//   const http = { endpoints: { 'api-server': { baseUrl: process.env.API_BASE_URL! } } };
//   export default defineConfig(() => ({
//     define: setupSimpleFakeApiHttpRoutes(http),
//   }));
//
// Webpack example:
//   new webpack.DefinePlugin(setupSimpleFakeApiHttpRoutes(http))
export function setupSimpleFakeApiHttpRoutes(config: InjectedHttpConfig): Record<string, any> {
  return {
    __SIMPLE_FAKE_API_HTTP__: JSON.stringify(config),
  };
}
