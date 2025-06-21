import React, { useEffect, useState } from 'react';
import styles from './Portfolio.module.scss';

type StockPosition = {
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
};

type PortfolioData = {
  balance: number; // Changed from cashBalance to balance
  positions: StockPosition[];
  totalValue: number;
  totalUnrealizedPnL: number;
  positionsValue?: number;
};

const Portfolio: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portfolio', { 
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(async res => {
        console.log('Response status:', res.status);
        console.log('Response headers:', res.headers);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.log('Error response:', errorText);
          throw new Error(errorText || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Portfolio data:', data);
        setPortfolio(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load portfolio', err);
        setLoading(false);
      });
  }, []);

  if (loading || !portfolio) {
    return <div className={styles.loading}>Loading your portfolio...</div>;
  }

  // Use the positionsValue from API or calculate it
  const securitiesValue = portfolio.positionsValue || portfolio.positions.reduce(
    (sum, p) => sum + (p.totalValue || p.quantity * p.currentPrice),
    0
  );

  return (
    <div className={styles.portfolio}>
      <div className={styles.header}>
        <h1>Portfolio Overview</h1>
        <p>Track your positions and performance.</p>
      </div>

      <div className={styles.summary}>
        <div className={styles.card}>
          <h2>Cash</h2>
          <p>${(portfolio.balance || 0).toFixed(2)}</p>
        </div>
        <div className={styles.card}>
          <h2>Securities</h2>
          <p>${securitiesValue.toFixed(2)}</p>
        </div>
        <div className={styles.card}>
          <h2>Total Value</h2>
          <p>${(portfolio.totalValue || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <h2 className={styles.sectionTitle}>Positions</h2>
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow}`}>
            <div>Ticker</div>
            <div>Name</div>
            <div>Qty</div>
            <div>Buy Price</div>
            <div>Current</div>
            <div>P/L</div>
            <div>P/L %</div>
            <div>Value</div>
          </div>
          {portfolio.positions.length === 0 ? (
            <div className={styles.empty}>No positions yet</div>
          ) : (
            portfolio.positions.map((pos, i) => {
              const plPercent = pos.unrealizedPnLPercent || 0;
              const unrealizedPnL = pos.unrealizedPnL || 0;

              return (
                <div key={i} className={styles.row}>
                  <div>{pos.ticker}</div>
                  <div>{pos.name || pos.ticker}</div>
                  <div>{pos.quantity}</div>
                  <div>${(pos.avgBuyPrice || 0).toFixed(2)}</div>
                  <div>${(pos.currentPrice || 0).toFixed(2)}</div>
                  <div className={unrealizedPnL >= 0 ? styles.profit : styles.loss}>
                    ${unrealizedPnL.toFixed(2)}
                  </div>
                  <div className={plPercent >= 0 ? styles.profit : styles.loss}>
                    {plPercent.toFixed(2)}%
                  </div>
                  <div>${(pos.totalValue || 0).toFixed(2)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {portfolio.totalUnrealizedPnL !== 0 && (
        <div className={styles.summary}>
          <div className={styles.card}>
            <h2>📊 Total Unrealized P/L</h2>
            <p className={portfolio.totalUnrealizedPnL >= 0 ? styles.profit : styles.loss}>
              ${portfolio.totalUnrealizedPnL.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;