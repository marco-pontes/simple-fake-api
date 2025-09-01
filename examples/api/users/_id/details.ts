import { getCollections } from '@marco-pontes/simple-fake-api';
import type { Request, Response } from '@marco-pontes/simple-fake-api/http';

export const get = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { users }: any = getCollections();
    const user = (users as any[]).find((u: any) => u.id === id);

    if (user) {
        res.json(user);
    } else {
        res.status(404).send('User not found.');
    }
};
