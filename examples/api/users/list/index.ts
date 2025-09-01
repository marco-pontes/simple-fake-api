import type { Request, Response } from 'express';
import { getCollections } from '@marco-pontes/simple-fake-api';

export const get = async (_req: Request, res: Response) => {
  const { users }: any = getCollections();
  res.json(users);
};
