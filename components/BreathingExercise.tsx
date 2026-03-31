
import React, { useState, useEffect } from 'react';
import { Wind, Play, Pause, RotateCcw } from 'lucide-react';
import { BreathingConfig, ThemeConfig } from '../types';
import { hexToRgba } from '../utils';

interface BreathingExerciseProps {
  config: BreathingConfig;
  theme: ThemeConfig;
}

type Phase = 'Inhale' | 'Hold' | 'Exhale' | 'Wait' | 'Ready';

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({ config, theme }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('Ready');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: number;

    if (isActive) {
      interval = window.setInterval(() => {
        setTimer(t => {
          const totalCycle = 16; // 4+4+4+4 (Box Breathing standard)
          const nextTick = (t + 1) % totalCycle;
          
          if (nextTick >= 0 && nextTick < 4) setPhase('Inhale');
          else if (nextTick >= 4 && nextTick < 8) setPhase('Hold');
          else if (nextTick >= 8 && nextTick < 12) setPhase('Exhale');
          else setPhase('Wait');

          return nextTick;
        });
      }, 1000);
    } else {
       setPhase('Ready');
       setTimer(0);
    }

    return () => clearInterval(interval);
  }, [isActive]);

  if (!config.enabled) return null;

  const getScale = () => {
      if (!isActive) return 1;
      const t = timer; // 0 to 15
      if (t < 4) return 1 + (t / 4) * 0.4; // Expanding
      if (t < 8) return 1.4; // Holding Full
      if (t < 12) return 1.4 - ((t - 8) / 4) * 0.4; // Contracting
      return 1; // Holding Empty
  };

  const getInstruction = () => {
      switch(phase) {
          case 'Inhale': return 'Breathe In...';
          case 'Hold': return 'Hold Breath...';
          case 'Exhale': return 'Breathe Out...';
          case 'Wait': return 'Hold Empty...';
          default: return 'Box Breathing';
      }
  };

  return (
    <div 
      className="w-full p-5 border backdrop-blur-sm transition-all duration-300 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden h-36"
      style={{
        borderColor: `${config.textColor}22`,
        borderRadius: theme.borderRadius,
        backgroundColor: hexToRgba(config.backgroundColor, config.opacityLevel),
        backdropFilter: config.blurLevel > 0 ? `blur(${config.blurLevel}px)` : 'none',
        color: config.textColor
      }}
    >
        {/* Left Side: Controls & Text */}
        <div className="flex flex-col justify-center gap-3 z-20 flex-1">
            <div>
                <div className="flex items-center gap-2 opacity-60 mb-1">
                    <Wind size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Relaxation</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight transition-all duration-500">
                    {getInstruction()}
                </h3>
            </div>

            <div className="flex gap-2 mt-1">
                <button 
                    onClick={() => setIsActive(!isActive)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                    style={{ 
                        backgroundColor: isActive ? theme.accentColor : `${config.textColor}15`,
                        color: isActive ? theme.backgroundColor : config.textColor
                    }}
                >
                    {isActive ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    {isActive ? 'Pause' : 'Start'}
                </button>
                <button 
                    onClick={() => { setIsActive(false); setTimeout(() => setIsActive(true), 100); }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
                    title="Reset Cycle"
                >
                    <RotateCcw size={14} />
                </button>
            </div>
        </div>

        {/* Right Side: Visualizer */}
        <div className="relative w-24 h-24 flex items-center justify-center mr-2">
            {/* Base Circle (Guide) */}
            <div 
                className="absolute w-16 h-16 rounded-full border-2 opacity-10"
                style={{ borderColor: config.textColor }}
            ></div>
            
            {/* Active Circle */}
            <div 
                className="w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-1000 ease-in-out relative z-10"
                style={{ 
                    transform: `scale(${getScale()})`,
                    borderColor: theme.accentColor,
                    backgroundColor: isActive ? `${theme.accentColor}10` : 'transparent',
                    boxShadow: isActive ? `0 0 20px ${hexToRgba(theme.accentColor, 0.2)}` : 'none'
                }}
            >
            </div>
            
            {/* Timer Text overlaying circle (optional, or kept inside) */}
            {isActive && (
                <div 
                    className="absolute text-xs font-mono font-bold opacity-60 pointer-events-none"
                    style={{ color: config.textColor }}
                >
                    {(timer % 4) + 1}s
                </div>
            )}
        </div>
    </div>
  );
};
