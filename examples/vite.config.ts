import { defineConfig } from 'vite';
import { setupSimpleFakeApiHttpRoutes } from '@marco-pontes/simple-fake-api/bundler';

// Example Vite config for a consumer app using simple-fake-api HTTP client
// It injects __SIMPLE_FAKE_API_HTTP__ from a config object you build here (optionally using env vars).
// Example env used here:
// - SIMPLE_FAKE_API_API_SERVER_BASE_URL=https://api.example.com

export default defineConfig(() => {
  const environment = process.env.NODE_ENV || 'development';
  return {
    define: {
      ...setupSimpleFakeApiHttpRoutes(environment),
    },
  };
});
