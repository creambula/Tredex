import { Router, Request, Response } from 'express';
import { yahooFinanceService } from '../services/yahooFinance';

const router = Router();

// Search for stocks
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.length < 1) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const results = await yahooFinanceService.searchStocks(query);
    res.json({ results });
  } catch (error) {
    console.error('Stock search error:', error);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});

// Get stock quote/price
router.get('/:symbol', async (req: Request, res: Response): Promise<void> => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    const stockData = await yahooFinanceService.getStockPrice(symbol);
    
    if (!stockData) {
      res.status(404).json({ error: 'Stock not found' });
      return;
    }

    res.json(stockData);
  } catch (error) {
    console.error('Stock price error:', error);
    res.status(500).json({ error: 'Failed to get stock price' });
  }
});

// Get multiple stock quotes
router.post('/quotes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbols } = req.body;
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      res.status(400).json({ error: 'Symbols array is required' });
      return;
    }

    const stockPrices = await yahooFinanceService.getMultipleStockPrices(symbols);
    const results = Object.fromEntries(stockPrices);
    
    res.json(results);
  } catch (error) {
    console.error('Multiple stock quotes error:', error);
    res.status(500).json({ error: 'Failed to get stock quotes' });
  }
});

export default router;