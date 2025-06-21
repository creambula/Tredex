import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { yahooFinanceService, StockData } from '../services/yahooFinance';

const router = Router();
const prisma = new PrismaClient();

// Define the position type for better TypeScript support
interface Position {
  id: string;
  ticker: string;
  quantity: number;
  avgBuyPrice: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PortfolioPosition {
  ticker: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  change: number;
  changePercent: number;
}

// Get user's portfolio
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Fetch user + owned positions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        positions: true // Use lowercase 'positions' to match schema
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // If user has no positions, return empty portfolio
    if (!user || user.positions.length === 0) {
      res.json({
        balance: user.balance || 0,
        positions: [],
        totalValue: user.balance || 0,
        totalUnrealizedPnL: 0
      });
      return;
    }

    // Get current stock prices from Yahoo Finance
    const symbols: string[] = user.positions.map((pos: Position) => pos.ticker);
    const stockPrices = await yahooFinanceService.getMultipleStockPrices(symbols);

    // Calculate portfolio positions with current prices
    const positions: PortfolioPosition[] = user.positions.map((position: Position) => {
      const stockData = stockPrices.get(position.ticker);
      const currentPrice = stockData?.price || position.avgBuyPrice; // Fallback to avg buy price
      const totalValue = currentPrice * position.quantity;
      const unrealizedPnL = (currentPrice - position.avgBuyPrice) * position.quantity;
      const unrealizedPnLPercent = ((currentPrice - position.avgBuyPrice) / position.avgBuyPrice) * 100;

      return {
        ticker: position.ticker,
        name: stockData?.name || position.ticker,
        quantity: position.quantity,
        avgBuyPrice: position.avgBuyPrice,
        currentPrice,
        totalValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        change: stockData?.change || 0,
        changePercent: stockData?.changePercent || 0
      };
    });

    const totalPortfolioValue = positions.reduce((sum: number, pos: PortfolioPosition) => sum + pos.totalValue, 0);
    const totalUnrealizedPnL = positions.reduce((sum: number, pos: PortfolioPosition) => sum + pos.unrealizedPnL, 0);
    const balance = user.balance || 0;

    res.json({
      balance,
      positions,
      totalValue: totalPortfolioValue + balance,
      totalUnrealizedPnL,
      positionsValue: totalPortfolioValue
    });
  } catch (err) {
    console.error('Portfolio error:', err);
    res.status(500).json({ error: 'Failed to load portfolio' });
  }
});

// Buy stock
router.post('/buy', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { ticker, quantity } = req.body;

    if (!ticker || !quantity || quantity <= 0) {
      res.status(400).json({ error: 'Invalid ticker or quantity' });
      return;
    }

    // Get current stock price from Yahoo Finance
    const stockData = await yahooFinanceService.getStockPrice(ticker.toUpperCase());
    if (!stockData) {
      res.status(404).json({ error: 'Stock not found' });
      return;
    }

    const price = stockData.price;
    const totalCost = quantity * price;

    // Start transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if user has enough cash
      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const currentCash = user.balance || 0;
      if (currentCash < totalCost) {
        throw new Error(`Insufficient funds: required ${totalCost}, available ${currentCash}`);
      }

      // Update or create position
      const existingPosition = await tx.position.findFirst({
        where: {
          userId: userId,
          ticker: ticker.toUpperCase()
        }
      });

      if (existingPosition) {
        // Update existing position
        const newQuantity = existingPosition.quantity + quantity;
        const newAvgPrice = ((existingPosition.avgBuyPrice * existingPosition.quantity) + (price * quantity)) / newQuantity;

        await tx.position.update({
          where: { id: existingPosition.id },
          data: {
            quantity: newQuantity,
            avgBuyPrice: newAvgPrice
          }
        });
      } else {
        // Create new position
        await tx.position.create({
          data: {
            userId,
            ticker: ticker.toUpperCase(),
            quantity,
            avgBuyPrice: price
          }
        });
      }

      // Record transaction
      await tx.transaction.create({
        data: {
          userId,
          ticker: ticker.toUpperCase(),
          type: 'BUY',
          quantity,
          price,
          totalAmount: totalCost
        }
      });

      // Update user's cash balance
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: currentCash - totalCost
        }
      });
    });

    res.json({ 
      success: true, 
      message: 'Stock purchased successfully',
      transaction: {
        ticker: ticker.toUpperCase(),
        quantity,
        price,
        totalCost,
        stockName: stockData.name
      }
    });
  } catch (error: any) {
    console.error('Buy stock error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to purchase stock' 
    });
  }
});

// Sell stock
router.post('/sell', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { ticker, quantity } = req.body;

    if (!ticker || !quantity || quantity <= 0) {
      res.status(400).json({ error: 'Invalid ticker or quantity' });
      return;
    }

    let realizedPnL = 0;
    let price = 0;
    let totalValue = 0;

    // Start transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if user owns this stock
      const position = await tx.position.findFirst({
        where: {
          userId: userId,
          ticker: ticker.toUpperCase()
        }
      });

      if (!position || position.quantity < quantity) {
        throw new Error(`Insufficient shares: owned ${position?.quantity || 0}, requested ${quantity}`);
      }

      // Get current stock price
      const stockData = await yahooFinanceService.getStockPrice(ticker.toUpperCase());
      if (!stockData) {
        throw new Error('Unable to get current stock price');
      }

      price = stockData.price;
      totalValue = quantity * price;
      realizedPnL = (price - position.avgBuyPrice) * quantity;

      // Update position or delete if selling all shares
      if (position.quantity === quantity) {
        // Selling all shares - delete position
        await tx.position.delete({
          where: { id: position.id }
        });
      } else {
        // Selling partial shares - update quantity
        await tx.position.update({
          where: { id: position.id },
          data: {
            quantity: position.quantity - quantity
          }
        });
      }

      // Record transaction
      await tx.transaction.create({
        data: {
          userId,
          ticker: ticker.toUpperCase(),
          type: 'SELL',
          quantity,
          price,
          totalAmount: totalValue
        }
      });

      // Update user's cash balance
      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          balance: (user?.balance || 0) + totalValue
        }
      });
    });

    res.json({ 
      success: true, 
      message: 'Stock sold successfully',
      transaction: {
        ticker: ticker.toUpperCase(),
        quantity,
        price,
        totalValue,
        realizedPnL,
        stockName: (await yahooFinanceService.getStockPrice(ticker.toUpperCase()))?.name
      }
    });
  } catch (error: any) {
    console.error('Sell stock error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to sell stock' 
    });
  }
});

export default router;