import React, { useEffect, useRef } from 'react';
import styles from './TradingViewWidget.module.scss';

declare global {
  interface Window {
    TradingView: any;
  }
}


interface Props {
  symbol: string;
}

const TradingViewWidget: React.FC<Props> = ({ symbol }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up any previous widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined') {
        new window.TradingView.widget({
          symbol: symbol,
          container_id: containerRef.current!.id,
          width: '100%',
          height: '100%',
          theme: 'dark',
          style: '1',
          locale: 'en',
          interval: 'D',
          hide_side_toolbar: true,
          allow_symbol_change: false,
          hide_top_toolbar: true,
          withdateranges: true,
        });
      }
    };

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className={styles.tradingViewWrapper}>
      <div
        className={styles.tradingViewInner}
        id={`tv_chart_container_${symbol}`}
        ref={containerRef}
      />
    </div>
  );
};

export default TradingViewWidget;
