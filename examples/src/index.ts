// Simple entry to call the users hook fetch function
// Run with: npx ts-node examples/src/index.ts (or compile first)

import { useUsers } from './hooks/useUsers.js';

const main = async () => {
  try {
    const { fetchUsers } = useUsers();
    const users = await fetchUsers();
    console.log('Users:', users);
  } catch (err) {
    console.error('Failed to fetch users:', err);
    process.exitCode = 1;
  }
};

await main();
