import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ✅ Use the router properly — don't pass functions to `use`
app.use('/auth', authRoutes);

app.get('/api/stocks/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const fakePrice = (Math.random() * 1000).toFixed(2);
  res.json({ symbol, price: fakePrice });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
