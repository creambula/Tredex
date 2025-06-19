import { Request, Response, NextFunction } from 'express';
import session from 'express-session';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
