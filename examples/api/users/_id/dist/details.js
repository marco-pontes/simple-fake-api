import { getCollections } from '@marco-pontes/simple-fake-api';
export const get = async (req, res) => {
    const { id } = req.params;
    const { users } = getCollections();
    const user = users.find((u) => u.id === id);
    if (user) {
        res.json(user);
    }
    else {
        res.status(404).send('User not found.');
    }
};
