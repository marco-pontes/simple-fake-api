// Example usage of the HTTP client from @marco-pontes/simple-fake-api
// It reads configuration from your package.json under "simple-fake-api-config.http".
// See examples/package.json for the configured endpoints.

import { create, Client } from '@marco-pontes/simple-fake-api/http';

export const httpClient: () => Client = () => {
  // Uses the endpoint named "api-server" from the package.json config
  return create('api-server');
};
