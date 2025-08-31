import type { Request, Response } from 'express';
import { getCollections } from 'fast-api';

export const get = async (req: Request, res: Response) => {
    const { orders }: any = getCollections();
    // Acessa a coleção de pedidos e envia como resposta
    res.json(orders);
};
