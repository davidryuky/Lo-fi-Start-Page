
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { SearchBarConfig, ThemeConfig } from '../types';
import { hexToRgba } from '../utils';

interface SearchBarProps {
  config: SearchBarConfig;
  theme: ThemeConfig;
}

export const SearchBar: React.FC<SearchBarProps> = ({ config, theme }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    window.location.href = `${config.engine.url}${encodeURIComponent(query)}`;
  };

  const currentBg = isFocused 
    ? hexToRgba(config.backgroundColor, Math.min(1, config.opacityLevel + 0.2))
    : hexToRgba(config.backgroundColor, config.opacityLevel);

  // Animation Keyframe for Pulse
  const pulseAnimationName = `border-pulse-${theme.accentColor.replace('#', '')}`;
  const pulseKeyframes = `
    @keyframes ${pulseAnimationName} {
      0% {
        border-color: ${theme.accentColor};
        box-shadow: 0 0 0 0 ${hexToRgba(theme.accentColor, 0)};
      }
      50% {
        border-color: ${hexToRgba(theme.accentColor, 0.5)};
        box-shadow: 0 0 10px 0 ${hexToRgba(theme.accentColor, 0.1)};
      }
      100% {
        border-color: ${theme.accentColor};
        box-shadow: 0 0 0 0 ${hexToRgba(theme.accentColor, 0)};
      }
    }
  `;

  return (
    <form onSubmit={handleSearch} className="w-full max-w-xl relative group animate-fade-in-up">
      <style>{pulseKeyframes}</style>
      <div 
        className={`
          flex items-center px-4 py-3 border-2 transition-all duration-500 ease-out
          ${isFocused ? 'scale-105' : 'scale-100'}
        `}
        style={{ 
          borderColor: isFocused ? theme.accentColor : `${config.textColor}44`,
          borderRadius: theme.borderRadius,
          backgroundColor: currentBg,
          backdropFilter: config.blurLevel > 0 ? `blur(${config.blurLevel}px)` : 'none',
          animation: isFocused ? `${pulseAnimationName} 2s infinite ease-in-out` : 'none',
        }}
      >
        <Search 
          size={20} 
          className="mr-3 transition-colors duration-300"
          style={{ color: isFocused ? theme.accentColor : config.textColor, opacity: 0.7 }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={`Search with ${config.engine.name}...`}
          className="w-full bg-transparent outline-none text-lg placeholder-opacity-50"
          style={{ 
            color: config.textColor,
            fontFamily: theme.font === 'mono' ? '"JetBrains Mono", monospace' : 'inherit'
          }}
          autoFocus
        />
      </div>
    </form>
  );
};
