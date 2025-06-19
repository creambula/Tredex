import { Router } from 'express';
import prisma from '../lib/prisma'; // make sure this path matches your setup
import axios from 'axios';
import { requireAuth } from '../middleware/auth'; // if you have auth middleware

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user + owned stocks
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stocks: true // assuming user has a relation to owned stocks
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch current prices (from external API or mock)
    const positions = await Promise.all(user.stocks.map(async (stock) => {
      const { ticker, quantity, avgBuyPrice } = stock;

      // Fetch current price
      const priceRes = await axios.get(`https://api.example.com/price?ticker=${ticker}`);
      const currentPrice = priceRes.data.price;

      return {
        ticker,
        quantity,
        avgBuyPrice,
        currentPrice
      };
    }));

    res.json({
      cashBalance: user.cashBalance,
      positions
    });
  } catch (err) {
    console.error('Portfolio error:', err);
    res.status(500).json({ error: 'Failed to load portfolio' });
  }
});

export default router;
