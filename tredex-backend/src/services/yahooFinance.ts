import axios from 'axios';

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

class YahooFinanceService {
  private baseURL = 'https://query1.finance.yahoo.com/v8/finance/chart';
  private searchURL = 'https://query2.finance.yahoo.com/v1/finance/search';

  async getStockPrice(symbol: string): Promise<StockData | null> {
    try {
      const response = await axios.get(`${this.baseURL}/${symbol.toUpperCase()}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const data = response.data;
      
      if (!data.chart?.result?.[0]) {
        return null;
      }

      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];
      
      return {
        symbol: meta.symbol,
        name: meta.longName || meta.symbol,
        price: meta.regularMarketPrice || 0,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume: meta.regularMarketVolume || 0,
        previousClose: meta.previousClose || 0,
        open: quote.open?.[quote.open.length - 1] || 0,
        high: quote.high?.[quote.high.length - 1] || 0,
        low: quote.low?.[quote.low.length - 1] || 0,
        marketCap: meta.marketCap
      };
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      return null;
    }
  }

  async searchStocks(query: string): Promise<SearchResult[]> {
    try {
      const response = await axios.get(this.searchURL, {
        params: {
          q: query,
          quotesCount: 10,
          newsCount: 0
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const quotes = response.data.quotes || [];
      
      return quotes
        .filter((quote: any) => quote.quoteType === 'EQUITY')
        .map((quote: any) => ({
          symbol: quote.symbol,
          name: quote.longname || quote.shortname || quote.symbol,
          type: quote.quoteType,
          exchange: quote.exchange
        }));
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }

  async getMultipleStockPrices(symbols: string[]): Promise<Map<string, StockData>> {
    const results = new Map<string, StockData>();
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => this.getStockPrice(symbol));
      
      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.set(batch[index], result.value);
        }
      });
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}

export const yahooFinanceService = new YahooFinanceService();