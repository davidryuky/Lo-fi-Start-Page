
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase } from 'lucide-react';
import { PomodoroConfig, ThemeConfig } from '../types';
import { hexToRgba } from '../utils';

interface PomodoroTimerProps {
  config: PomodoroConfig;
  theme: ThemeConfig;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ config, theme }) => {
  const [timeLeft, setTimeLeft] = useState(config.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  
  // Use ref to track interval for cleanup
  const intervalRef = useRef<number | null>(null);

  // Reset timer if config changes
  useEffect(() => {
    setTimeLeft(mode === 'work' ? config.workDuration * 60 : config.breakDuration * 60);
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [config.workDuration, config.breakDuration]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Optional: Audio beep could go here
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? config.workDuration * 60 : config.breakDuration * 60);
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'work' ? config.workDuration * 60 : config.breakDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!config.enabled) return null;

  return (
    <div 
      className="w-full p-6 border backdrop-blur-sm transition-all duration-300 shadow-sm flex flex-col items-center justify-center gap-4"
      style={{
        borderColor: `${config.textColor}22`,
        borderRadius: theme.borderRadius,
        backgroundColor: hexToRgba(config.backgroundColor, config.opacityLevel),
        backdropFilter: config.blurLevel > 0 ? `blur(${config.blurLevel}px)` : 'none',
        color: config.textColor
      }}
    >
      <div className="flex items-center justify-between w-full opacity-60">
        <button 
            onClick={() => switchMode('work')}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${mode === 'work' ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
            style={{ color: mode === 'work' ? theme.accentColor : config.textColor }}
        >
            <Briefcase size={12} /> Work
        </button>
        <button 
            onClick={() => switchMode('break')}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${mode === 'break' ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
            style={{ color: mode === 'break' ? theme.accentColor : config.textColor }}
        >
            <Coffee size={12} /> Break
        </button>
      </div>

      <div className="text-5xl font-mono font-bold tracking-tighter tabular-nums">
        {formatTime(timeLeft)}
      </div>

      <div className="flex gap-4">
        <button 
          onClick={toggleTimer}
          className="p-3 rounded-full hover:bg-white/10 transition-colors"
          style={{ backgroundColor: isActive ? `${theme.accentColor}20` : 'transparent', color: isActive ? theme.accentColor : config.textColor }}
        >
          {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        <button 
          onClick={resetTimer}
          className="p-3 rounded-full hover:bg-white/10 transition-colors opacity-60 hover:opacity-100"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};
