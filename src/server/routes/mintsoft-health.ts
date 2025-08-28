import { Router, Request, Response } from 'express';
import { healthCheck } from '../../lib/mintsoft/client';

const router = Router();

router.get('/mintsoft/health', async (_req: Request, res: Response) => {
  const result = await healthCheck();
  if (result.ok) {
    return res.json(result);
  }
  return res.status(result.status || 500).json(result);
});

export default router;
