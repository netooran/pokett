import { NextApiRequest, NextApiResponse } from 'next';

export type ApiHandler<T = any> = (
  req: NextApiRequest,
  res: NextApiResponse<T>
) => void | Promise<void>;
