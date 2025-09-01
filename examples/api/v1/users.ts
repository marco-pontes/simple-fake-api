import { getCollections } from '@marco-pontes/simple-fake-api';
import type { Request, Response } from '@marco-pontes/simple-fake-api/http';

export const get = async (_req: Request, res: Response) => {
  const { users }: any = getCollections();
  res.json(users);
};
