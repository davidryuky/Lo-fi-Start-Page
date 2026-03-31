
import React from 'react';
import { PenTool } from 'lucide-react';
import { AppConfig } from '../types';
import { hexToRgba } from '../utils';

interface NotesWidgetProps {
  config: AppConfig;
  onUpdate: (newConfig: AppConfig) => void;
}

export const NotesWidget: React.FC<NotesWidgetProps> = ({ config, onUpdate }) => {
  if (!config.notes.enabled) return null;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
        ...config,
        notes: {
            ...config.notes,
            content: e.target.value
        }
    });
  };

  return (
    <div 
      className="w-full border backdrop-blur-sm transition-all duration-300 shadow-sm flex flex-col h-64 overflow-hidden"
      style={{
        borderColor: `${config.notes.textColor}22`,
        borderRadius: config.theme.borderRadius,
        backgroundColor: hexToRgba(config.notes.backgroundColor, config.notes.opacityLevel),
        backdropFilter: config.notes.blurLevel > 0 ? `blur(${config.notes.blurLevel}px)` : 'none',
        color: config.notes.textColor
      }}
    >
      {/* Header Area - Safe for Dragging */}
      <div className="flex items-center gap-2 opacity-50 px-6 pt-5 pb-2 select-none">
         <PenTool size={12} />
         <span className="text-xs font-bold uppercase tracking-widest">Scratchpad</span>
      </div>
      
      {/* Text Area */}
      <div className="flex-1 px-6 pb-6 pt-0">
        <textarea
            value={config.notes.content}
            onChange={handleChange}
            placeholder="Type something..."
            className="w-full h-full bg-transparent resize-none outline-none text-sm leading-relaxed scrollbar-hide"
            spellCheck={false}
            style={{
                color: config.notes.textColor,
                fontFamily: config.theme.font === 'mono' ? '"JetBrains Mono", monospace' : 'inherit'
            }}
        />
      </div>
    </div>
  );
};
