// Example usage of the HTTP client from @marco-pontes/simple-fake-api
// It reads configuration from your package.json under "simple-fake-api-config.http".
// See examples/package.json for the configured endpoints.
import { create } from '@marco-pontes/simple-fake-api/http';
export const httpClient = () => {
    // Uses the endpoint named "api-server" from the package.json config
    return create('api-server');
};
// Example function using the client
export async function fetchUsers() {
    const api = httpClient();
    const res = await api.get('/users');
    if (!res.ok)
        throw new Error(`Request failed: ${res.status}`);
    return res.json();
}
//# sourceMappingURL=http-client.js.map