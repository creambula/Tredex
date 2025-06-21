import React, { useEffect, useState } from 'react';
import styles from './Trade.module.scss';
import TradingViewWidget from '../components/TradingViewWidget';

interface StockQuote {
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

interface Trade {
  type: 'BUY' | 'SELL';
  ticker: string;
  quantity: number;
  price: number;
  totalAmount: number;
  createdAt: string;
}

const Trade: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('SPY');
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [loadingQuote, setLoadingQuote] = useState(false);

  useEffect(() => {
    fetchQuote(selectedSymbol);
    fetchRecentTrades();
  }, [selectedSymbol]);

  const fetchQuote = async (symbol: string) => {
    setLoadingQuote(true);
    try {
      const res = await fetch(`/api/stocks/${symbol}`);
      const data = await res.json();
      setQuote(data);
    } catch (e) {
      console.error('Failed to fetch quote', e);
    } finally {
      setLoadingQuote(false);
    }
  };

  const fetchRecentTrades = async () => {
    try {
      const res = await fetch('/api/user/trades');
      const data = await res.json();
      setRecentTrades(data.trades);
    } catch (e) {
      console.error('Failed to fetch recent trades', e);
    }
  };

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) return setSuggestions([]);

    try {
      const res = await fetch(`/api/stocks/search?q=${q}`);
      const data = await res.json();
      setSuggestions(data.results);
    } catch (e) {
      console.error('Failed to search stocks', e);
    }
  };

  const handleBuySell = async (type: 'BUY' | 'SELL') => {
    try {
      const res = await fetch(`/api/portfolio/${type.toLowerCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ticker: selectedSymbol, quantity })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Trade failed');
      alert(`${type} successful!`);
      fetchQuote(selectedSymbol);
      fetchRecentTrades();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  return (
    <div className={styles.trade}>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search stock ticker..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {suggestions.length > 0 && (
          <ul className={styles.suggestions}>
            {suggestions.map((s, i) => (
              <li key={i} onClick={() => {
                setSelectedSymbol(s.symbol);
                setQuery('');
                setSuggestions([]);
              }}>{s.symbol} - {s.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.mainContent}>
        <div className={styles.chart}><TradingViewWidget symbol={selectedSymbol} /></div>
        <div className={styles.stats}>
          <h2>{quote?.symbol || selectedSymbol}</h2>
          {loadingQuote ? <p>Loading...</p> : quote && (
            <>
              <p><strong>Name:</strong> {quote.name}</p>
              <p><strong>Price:</strong> ${quote.price.toFixed(2)}</p>
              <p><strong>Change:</strong> {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)</p>
              <p><strong>Volume:</strong> {quote.volume.toLocaleString()}</p>
              <p><strong>Open:</strong> ${quote.open.toFixed(2)}</p>
              <p><strong>High:</strong> ${quote.high.toFixed(2)}</p>
              <p><strong>Low:</strong> ${quote.low.toFixed(2)}</p>
              <div className={styles.tradeForm}>
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
                <button onClick={() => handleBuySell('BUY')}>Buy</button>
                <button onClick={() => handleBuySell('SELL')}>Sell</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.recentTrades}>
        <h2>Recent Trades</h2>
        {recentTrades.length === 0 ? <p>No recent trades</p> : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Ticker</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade, i) => (
                <tr key={i}>
                  <td>{trade.type}</td>
                  <td>{trade.ticker}</td>
                  <td>{trade.quantity}</td>
                  <td>${trade.price.toFixed(2)}</td>
                  <td>${trade.totalAmount.toFixed(2)}</td>
                  <td>{new Date(trade.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Trade;