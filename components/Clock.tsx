
import React, { useState, useEffect } from 'react';
import { ClockConfig, ThemeConfig } from '../types';
import { hexToRgba } from '../utils';

interface ClockProps {
  config: ClockConfig;
  theme: ThemeConfig;
  username: string;
}

export const Clock: React.FC<ClockProps> = ({ config, theme, username }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !config.use24Hour,
    });
  };

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (!config.enabled) return null;

  return (
    <div 
      className="flex flex-col items-center justify-center p-6 select-none transition-all duration-300"
      style={{
         backgroundColor: hexToRgba(config.backgroundColor, config.opacityLevel),
         backdropFilter: config.blurLevel > 0 ? `blur(${config.blurLevel}px)` : 'none',
         borderRadius: theme.borderRadius,
         // If opacity is 0, we typically want no border, but let's keep it clean
         border: config.opacityLevel > 0 ? `1px solid ${config.textColor}22` : 'none',
      }}
    >
      <h1 
        className="text-6xl md:text-8xl font-bold tracking-tight mb-2 text-center"
        style={{ color: config.textColor }}
      >
        {formatTime(time)}
      </h1>
      {config.showGreeting && (
        <p 
          className="text-lg md:text-xl opacity-80 text-center"
          style={{ color: config.textColor }}
        >
          {getGreeting()}, <span style={{ color: theme.accentColor }}>{username}</span>.
        </p>
      )}
    </div>
  );
};
