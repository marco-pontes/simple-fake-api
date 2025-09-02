import { getCollections } from '@marco-pontes/simple-fake-api';
export const get = async (_req, res) => {
    const { users } = getCollections();
    res.json(users);
};
//# sourceMappingURL=index.js.map