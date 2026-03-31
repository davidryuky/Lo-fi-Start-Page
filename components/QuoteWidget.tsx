
import React, { useEffect, useState } from 'react';
import { QuoteConfig, ThemeConfig } from '../types';
import { QUOTES } from '../constants';
import { hexToRgba, getQuoteFont } from '../utils';

interface QuoteWidgetProps {
  config: QuoteConfig;
  theme: ThemeConfig;
}

export const QuoteWidget: React.FC<QuoteWidgetProps> = ({ config, theme }) => {
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    // Randomize quote on mount
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[randomIndex]);
  }, []);

  if (!config.enabled) return null;

  return (
    <div 
        className="flex flex-col items-center justify-center max-w-2xl text-center px-8 py-4 mb-4 select-none animate-fade-in transition-all duration-300"
        style={{
            backgroundColor: hexToRgba(config.backgroundColor, config.opacityLevel),
            backdropFilter: config.blurLevel > 0 ? `blur(${config.blurLevel}px)` : 'none',
            borderRadius: theme.borderRadius,
            color: config.textColor,
            border: config.opacityLevel > 0 ? `1px solid ${config.textColor}22` : 'none',
        }}
    >
      <p 
        className={`text-lg md:text-xl transition-all duration-300`}
        style={{ 
            fontFamily: getQuoteFont(config.font),
            fontStyle: config.italic ? 'italic' : 'normal',
            opacity: 0.9
        }}
      >
        "{quote.text}"
      </p>
      <span 
        className="text-xs mt-2 font-medium tracking-wide uppercase opacity-60"
        style={{ fontFamily: '"Inter", sans-serif' }}
      >
        — {quote.author}
      </span>
    </div>
  );
};
