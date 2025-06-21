import { Request, Response, NextFunction } from 'express';

type Position = {
  id: string;
  ticker: string;
  quantity: number;
  avgBuyPrice: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

// Extend the Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        discordId: string;
        username: string;
        avatarUrl: string | null;
        balance: number; // Make sure this matches your schema
        createdAt: Date;
        updatedAt: Date;
        positions?: Position[]; // Use lowercase and array type
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.cookies.user_id;
  
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized - No user ID in cookies' });
    return;
  }

  try {
    // You'll need to import PrismaClient here
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized - User not found' });
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}