import React, { useEffect, useState } from 'react';
import styles from './Portfolio.module.scss';

type StockPosition = {
  ticker: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
};

type PortfolioData = {
  cashBalance: number;
  positions: StockPosition[];
};

const Portfolio: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);

  useEffect(() => {
    // Replace with your actual backend call
    fetch('/api/portfolio')
      .then(res => res.json())
      .then(data => setPortfolio(data))
      .catch(err => console.error('Failed to load portfolio', err));
  }, []);

  if (!portfolio) return <div className={styles.loading}>Loading portfolio...</div>;

  const securitiesValue = portfolio.positions.reduce(
    (acc, stock) => acc + stock.quantity * stock.currentPrice,
    0
  );

  const totalValue = portfolio.cashBalance + securitiesValue;

  return (
    <div className={styles.portfolio}>
      <div className={styles.summary}>
        <div>💰 Cash: ${portfolio.cashBalance.toFixed(2)}</div>
        <div>📈 Securities: ${securitiesValue.toFixed(2)}</div>
        <div>📊 Total Value: ${totalValue.toFixed(2)}</div>
      </div>

      <div className={styles.table}>
        <div className={styles.row + ' ' + styles.header}>
          <div>Ticker</div>
          <div>Qty</div>
          <div>Buy Price</div>
          <div>Current</div>
          <div>P/L %</div>
          <div>Value</div>
        </div>
        {portfolio.positions.map((stock, i) => {
          const totalCost = stock.quantity * stock.avgBuyPrice;
          const totalNow = stock.quantity * stock.currentPrice;
          const plPercent = ((totalNow - totalCost) / totalCost) * 100;

          return (
            <div key={i} className={styles.row}>
              <div>{stock.ticker}</div>
              <div>{stock.quantity}</div>
              <div>${stock.avgBuyPrice.toFixed(2)}</div>
              <div>${stock.currentPrice.toFixed(2)}</div>
              <div className={plPercent >= 0 ? styles.profit : styles.loss}>
                {plPercent.toFixed(2)}%
              </div>
              <div>${totalNow.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Portfolio;
