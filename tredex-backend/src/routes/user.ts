// routes/user.ts or similar
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// GET /api/user/trades
router.get('/trades', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const trades = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to 20 most recent
    });

    res.json({ trades });
  } catch (err) {
    console.error('Error fetching user trades:', err);
    res.status(500).json({ error: 'Failed to fetch recent trades' });
  }
});

export default router;
