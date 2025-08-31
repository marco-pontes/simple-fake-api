import type { Request, Response } from 'express';
import { getCollections } from 'fast-api';

export const get = async (req: Request, res: Response) => {
    const { users }: any = getCollections();
    // Acessa a coleção de usuários e envia como resposta
    res.json(users);
};
