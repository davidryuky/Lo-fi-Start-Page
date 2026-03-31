
import React, { useEffect, useState, memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CryptoConfig, ThemeConfig } from '../types';
import { hexToRgba } from '../utils';

interface CryptoTickerProps {
  config: CryptoConfig;
  theme: ThemeConfig;
}

interface CoinData {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export const CryptoTicker: React.FC<CryptoTickerProps> = memo(({ config, theme }) => {
  const [data, setData] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config.enabled) return;

    // Check sessionStorage cache first
    const cacheKey = `crypto_cache_${config.coins}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < 120000) { // 2 min cache
                setData(data);
                setLoading(false);
            }
        } catch (e) {}
    }

    const fetchCrypto = async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${config.coins}&order=market_cap_desc&per_page=10&page=1&sparkline=false`
        );
        if (!response.ok) throw new Error('Failed to fetch crypto');
        const json = await response.json();
        
        setData(json);
        setLoading(false);
        // Save to cache
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: json }));

      } catch (err) {
        console.error("Crypto Widget Error:", err);
        setLoading(false);
      }
    };

    fetchCrypto();
    // Refresh every 2 minutes to respect API rate limits
    const interval = setInterval(fetchCrypto, 120000); 
    return () => clearInterval(interval);
  }, [config.enabled, config.coins]);

  if (!config.enabled) return null;

  return (
    <div 
      className="w-full overflow-hidden border transition-all duration-300 shadow-sm flex items-center h-12 relative select-none"
      style={{
        borderColor: `${config.textColor}22`,
        borderRadius: theme.borderRadius,
        backgroundColor: hexToRgba(config.backgroundColor, config.opacityLevel),
        backdropFilter: config.blurLevel > 0 ? `blur(${config.blurLevel}px)` : 'none',
        color: config.textColor
      }}
    >
      {/* Gradients to fade text on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-[rgba(0,0,0,0.1)] to-transparent pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-[rgba(0,0,0,0.1)] to-transparent pointer-events-none"></div>

      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        {loading && data.length === 0 ? (
           <div className="text-xs opacity-50 px-4 animate-pulse">Loading market data...</div>
        ) : (
          <div className="animate-marquee whitespace-nowrap flex items-center gap-8 px-4">
            {/* Duplicate list for smooth infinite scroll */}
            {[...data, ...data].map((coin, i) => (
              <div key={`${coin.id}-${i}`} className="flex items-center gap-2 text-sm">
                <span className="font-bold uppercase opacity-80">{coin.symbol}</span>
                <span className="font-mono">${coin.current_price.toLocaleString()}</span>
                <span className={`flex items-center text-xs font-medium ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                   {coin.price_change_percentage_24h >= 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                   {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
});
