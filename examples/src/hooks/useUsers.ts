// React-style hook for users-related HTTP operations using the example http client
// This file lives under examples/src/hooks as requested.

import { httpClient } from '../http-client.js';

export const useUsers = () => {
  const fetchUsers = async () => {
    const api = httpClient();
    const res = await api.get('/users');
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  };

  return { fetchUsers };
};
