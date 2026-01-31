
import React, { useState } from 'react';
import { GripVertical, X } from 'lucide-react';

interface DraggableWidgetProps {
  id: string;
  section: 'header' | 'sidebar' | 'topLeft' | 'topRight';
  onDragStart: (e: React.DragEvent, id: string, section: string) => void;
  onDrop: (e: React.DragEvent, id: string, section: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onRemove?: (id: string) => void;
  isDragged: boolean;
  locked: boolean;
  onDragModeChange?: (isDragMode: boolean) => void;
  children: React.ReactNode;
}

export const DraggableWidget: React.FC<DraggableWidgetProps> = ({ 
  id, section, onDragStart, onDrop, onDragOver, onRemove, isDragged, locked, onDragModeChange, children 
}) => {
  const [canDrag, setCanDrag] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleDragStartInternal = (e: React.DragEvent) => {
    if (locked || !canDrag) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(e, id, section);
    
    // Trigger the drop zones ONLY when the drag actually begins
    if (onDragModeChange) onDragModeChange(true);
  };

  const handleDragEnd = () => {
      setIsPressed(false);
      if (onDragModeChange) onDragModeChange(false);
  };

  const handleGripMouseDown = () => {
      if (locked) return;
      setIsPressed(true);
  };

  const handleGripMouseUp = () => {
      setIsPressed(false);
  };

  // Styles
  let transformClass = "scale-100";
  let opacityClass = "opacity-100";
  let blurClass = "blur-none";
  let borderClass = "ring-0 ring-transparent";

  if (isDragged) {
      opacityClass = "opacity-40";
      blurClass = "blur-[2px]";
      transformClass = "scale-[0.98]";
  } else if (isPressed) {
      transformClass = "scale-[1.01]";
      borderClass = "ring-2 ring-emerald-400 ring-offset-2 ring-offset-transparent";
  }

  // Common button styles - Semi-transparent / Frosted
  const glassButtonStyle = `
    p-1.5 rounded-md
    bg-white/40 backdrop-blur-md border border-white/20 shadow-sm
    text-neutral-700
    transition-all duration-200
  `;

  return (
    <div
      draggable={canDrag && !locked}
      onDragStart={handleDragStartInternal}
      onDragOver={onDragOver}
      onDrop={(e) => !locked && onDrop(e, id, section)}
      onDragEnd={handleDragEnd}
      className={`
        group relative transition-all duration-300 ease-out will-change-transform
        ${transformClass} ${opacityClass} ${blurClass} ${borderClass}
        rounded-xl
      `}
    >
      {/* Widget Content */}
      <div className="w-full h-full relative z-0">
        {children}
      </div>

      {/* CONTROLS CONTAINER */}
      {!locked && (
        <div 
            className={`
                absolute top-3 right-3 z-50 flex items-center gap-2
                opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
                transition-all duration-200
            `}
        >
            {/* Delete Button */}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(id);
                    }}
                    className={`${glassButtonStyle} hover:bg-white/90 hover:text-red-500 hover:border-red-100 cursor-pointer`}
                    title="Remove widget"
                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
                >
                    <X size={14} />
                </button>
            )}

            {/* Drag Handle */}
            <div
                onMouseEnter={() => setCanDrag(true)}
                onMouseLeave={() => {
                    setCanDrag(false);
                    if (!isPressed) setIsPressed(false);
                }}
                onMouseDown={handleGripMouseDown}
                onMouseUp={handleGripMouseUp}
                className={`${glassButtonStyle} hover:bg-white/90 hover:text-neutral-900 hover:border-neutral-300 cursor-grab active:cursor-grabbing select-none`}
                title="Hold to drag"
            >
                <GripVertical size={14} />
            </div>
        </div>
      )}
    </div>
  );
};
