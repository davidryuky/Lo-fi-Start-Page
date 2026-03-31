
import React from 'react';
import { RotateCcw } from 'lucide-react';
import { WidgetStyle } from '../../types';

interface WidgetStylerProps {
    label: string;
    config: WidgetStyle;
    onChange: (u: Partial<WidgetStyle>) => void;
    onReset: () => void;
}

export const WidgetStyler: React.FC<WidgetStylerProps> = ({ 
    label, 
    config, 
    onChange,
    onReset 
}) => {
    const toHexInput = (color: string) => color.length > 7 ? color.substring(0, 7) : color;

    return (
        <div className="bg-neutral-50/50 p-5 rounded-2xl w-full hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200">
            <div className="flex justify-between items-center mb-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-600">{label} Styling</h5>
                <button 
                    onClick={onReset}
                    className="text-neutral-500 hover:text-neutral-900 transition-colors p-1.5 rounded-full hover:bg-neutral-200"
                    title="Reset to default"
                >
                    <RotateCcw size={14} />
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Colors */}
                <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-200 shadow-sm cursor-pointer hover:border-neutral-300 transition-colors group">
                        <span className="text-sm font-semibold text-neutral-700 pl-1">Background</span>
                        <div className="flex items-center gap-2">
                            <div className="text-xs font-mono text-neutral-500 group-hover:text-neutral-700 font-medium">{config.backgroundColor}</div>
                            <div 
                                className="w-6 h-6 rounded-full border border-black/10 shadow-inner"
                                style={{ backgroundColor: config.backgroundColor }}
                            ></div>
                        </div>
                        <input 
                            type="color" 
                            value={toHexInput(config.backgroundColor)} 
                            onChange={(e) => onChange({ backgroundColor: e.target.value })}
                            className="absolute opacity-0 w-0 h-0"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-200 shadow-sm cursor-pointer hover:border-neutral-300 transition-colors group">
                        <span className="text-sm font-semibold text-neutral-700 pl-1">Text</span>
                        <div className="flex items-center gap-2">
                             <div className="text-xs font-mono text-neutral-500 group-hover:text-neutral-700 font-medium">{config.textColor}</div>
                             <div 
                                className="w-6 h-6 rounded-full border border-black/10 shadow-inner"
                                style={{ backgroundColor: config.textColor }}
                            ></div>
                        </div>
                        <input 
                            type="color" 
                            value={toHexInput(config.textColor)} 
                            onChange={(e) => onChange({ textColor: e.target.value })}
                            className="absolute opacity-0 w-0 h-0"
                        />
                    </label>
                </div>
            
                {/* Sliders */}
                <div className="space-y-5 py-1">
                    <div>
                        <div className="flex justify-between text-xs font-bold text-neutral-600 mb-2">
                            <span>Opacity</span>
                            <span>{Math.round(config.opacityLevel * 100)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.05"
                            value={config.opacityLevel}
                            onChange={(e) => onChange({ opacityLevel: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-900 hover:accent-neutral-700"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-bold text-neutral-600 mb-2">
                            <span>Blur</span>
                            <span>{config.blurLevel}px</span>
                        </div>
                        <input 
                            type="range" min="0" max="20"
                            value={config.blurLevel}
                            onChange={(e) => onChange({ blurLevel: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-900 hover:accent-neutral-700"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
