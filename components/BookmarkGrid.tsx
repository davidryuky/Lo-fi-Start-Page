
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Globe, Star, Tag, Eye, EyeOff, Lock, Unlock, ArrowRight, X } from 'lucide-react';
import { AppConfig, Bookmark, BookmarkSize } from '../types';
import { hexToRgba, simpleHash } from '../utils';

interface BookmarkGridProps {
  config: AppConfig;
  onUpdate: (newConfig: AppConfig) => void;
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  index: number;
  isFav?: boolean;
  config: AppConfig;
  size: BookmarkSize;
  isDragged: boolean;
  isDropTarget: boolean;
  dropSide: 'left' | 'right' | null;
  onDragStart?: (e: React.DragEvent, id: string, group: string) => void;
  onDrop?: (e: React.DragEvent, id: string, group: string) => void;
  onDragOver?: (e: React.DragEvent, id: string, group: string, rect: DOMRect) => void;
  onDragLeave?: () => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ 
  bookmark, index, isFav, config, size, isDragged, isDropTarget, dropSide,
  onDragStart, onDrop, onDragOver, onDragLeave
}) => {
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImageError(false);
  }, [bookmark.url]);

  const group = isFav ? 'favorites' : (bookmark.category || 'General');
  const isLocked = config.lockLayout || bookmark.category === 'Private';

  const getHeight = () => {
    switch(size) {
        case 'icon': return 'auto';
        case 'small': return '80px';
        case 'large': return isFav ? '140px' : '120px';
        case 'medium': default: return isFav ? '120px' : '100px';
    }
  };

  const getIconSize = () => {
     switch(size) {
        case 'icon': return 28;
        case 'small': return 16;
        case 'large': return 32;
        case 'medium': default: return isFav ? 24 : 20;
    }
  };

  const domain = useMemo(() => {
    try {
        return new URL(bookmark.url).hostname;
    } catch {
        return '';
    }
  }, [bookmark.url]);

  const faviconUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(bookmark.url)}&size=128`;

  // Dynamic Styles for Drag Interaction
  let transformClass = "scale-100";
  let opacityClass = "opacity-100";
  let blurClass = "blur-none";
  let borderClass = "";

  if (isDragged) {
      opacityClass = "opacity-30";
      blurClass = "blur-[2px]";
      transformClass = "scale-95";
      borderClass = "border-dashed";
  }

  // Drop indicator styles
  const dropIndicatorLeft = isDropTarget && dropSide === 'left';
  const dropIndicatorRight = isDropTarget && dropSide === 'right';

  return (
    <div className="relative" style={{ animationDelay: `${index * 40}ms` }}>
      {/* Left drop indicator */}
      {dropIndicatorLeft && (
        <div 
          className="absolute -left-2 top-1 bottom-1 w-1 rounded-full z-30 animate-pulse"
          style={{ backgroundColor: config.theme.accentColor, boxShadow: `0 0 8px ${config.theme.accentColor}` }}
        />
      )}

      <div
        ref={cardRef}
        draggable={!isLocked}
        onDragStart={(e) => !isLocked && onDragStart && onDragStart(e, bookmark.id, group)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (cardRef.current && onDragOver) {
            onDragOver(e, bookmark.id, group, cardRef.current.getBoundingClientRect());
          }
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => !isLocked && onDrop && onDrop(e, bookmark.id, group)}
        className={`
          group flex flex-col items-center justify-center p-3 
          border transition-all duration-300 ease-out relative will-change-transform
          animate-fade-in-up
          ${transformClass} ${opacityClass} ${blurClass} ${borderClass}
          ${!isLocked ? 'cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-sm' : ''}
          ${size === 'icon' ? 'aspect-square' : ''}
        `}
        style={{
          height: getHeight(),
          backgroundColor: hexToRgba(config.bookmarkStyle.backgroundColor, config.bookmarkStyle.opacityLevel),
          backdropFilter: config.bookmarkStyle.blurLevel > 0 ? `blur(${config.bookmarkStyle.blurLevel}px)` : 'none',
          borderColor: `${config.bookmarkStyle.textColor}22`,
          borderRadius: size === 'icon' ? '50%' : config.theme.borderRadius,
          animationDelay: `${index * 40}ms`,
          animationFillMode: 'backwards',
        }}
      >
        <a 
          href={bookmark.url}
          draggable={false}
          onClick={(e) => {
              // Prevent navigation if we started a drag
              if (isDragged) e.preventDefault();
          }}
          className="flex flex-col items-center justify-center w-full h-full gap-2 text-center z-10 select-none"
          title={size === 'icon' ? bookmark.title : undefined}
        >
          <div 
              className="rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110"
              style={{ 
                  width: size === 'large' ? '48px' : size === 'medium' ? '36px' : size === 'icon' ? '32px' : '24px',
                  height: size === 'large' ? '48px' : size === 'medium' ? '36px' : size === 'icon' ? '32px' : '24px',
                  backgroundColor: 'transparent', 
              }}
          >
              {!imageError && domain ? (
                  <img 
                      src={faviconUrl} 
                      alt="" 
                      draggable={false} 
                      className="w-full h-full object-cover pointer-events-none" 
                      onError={() => setImageError(true)}
                      loading="lazy"
                  />
              ) : (
                  <Globe 
                      size={getIconSize()} 
                      className="pointer-events-none"
                      style={{ color: isFav ? config.theme.accentColor : config.bookmarkStyle.textColor }} 
                      strokeWidth={1.5}
                  />
              )}
          </div>
          
          {size !== 'icon' && (
              <span 
                  className="font-medium truncate w-full px-2 pointer-events-none"
                  style={{ 
                      color: config.bookmarkStyle.textColor,
                      fontSize: size === 'small' ? '0.75rem' : '0.875rem' 
                  }}
              >
                  {bookmark.title}
              </span>
          )}
        </a>

          {isFav && !imageError && (
               <div className={`absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${size === 'icon' ? 'top-1 right-1' : 'top-2 right-2'}`}>
                  <Star size={10} fill={config.theme.accentColor} stroke="none" />
               </div>
          )}
      </div>

      {/* Right drop indicator */}
      {dropIndicatorRight && (
        <div 
          className="absolute -right-2 top-1 bottom-1 w-1 rounded-full z-30 animate-pulse"
          style={{ backgroundColor: config.theme.accentColor, boxShadow: `0 0 8px ${config.theme.accentColor}` }}
        />
      )}
    </div>
  );
};

export const BookmarkGrid: React.FC<BookmarkGridProps> = ({ config, onUpdate }) => {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [draggedCategory, setDraggedCategory] = useState<string | null>(null);

    // Drop target tracking
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const [dropSide, setDropSide] = useState<'left' | 'right' | null>(null);

    // Private Category State
    const [isPrivateExpanded, setIsPrivateExpanded] = useState(false);
    const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);
    const [privatePassword, setPrivatePassword] = useState('');
    const [privateError, setPrivateError] = useState(false);

    const favorites = config.bookmarks.filter(b => b.isFavorite && b.category !== 'Private');
    
    const categories = useMemo(() => {
        const cats: Record<string, Bookmark[]> = {};
        config.bookmarks.forEach(b => {
            if (!b.isFavorite) {
                const cat = b.category || 'General';
                if (!cats[cat]) cats[cat] = [];
                cats[cat].push(b);
            }
        });
        return cats;
    }, [config.bookmarks]);

    const sortedCategories = useMemo(() => {
        const derivedCats = Object.keys(categories);
        const order = config.categoryOrder || [];
        
        return derivedCats.sort((a, b) => {
            const idxA = order.indexOf(a);
            const idxB = order.indexOf(b);
            
            if (idxA > -1 && idxB > -1) return idxA - idxB;
            if (idxA > -1) return -1;
            if (idxB > -1) return 1;
            return a.localeCompare(b);
        });
    }, [categories, config.categoryOrder]);

    const collapsedCats = config.collapsedCategories || [];
    const isLocked = config.lockLayout;

    const toggleCategory = (catName: string) => {
        let newCollapsed = [];
        if (collapsedCats.includes(catName)) {
            newCollapsed = collapsedCats.filter(c => c !== catName);
        } else {
            newCollapsed = [...collapsedCats, catName];
        }
        onUpdate({ ...config, collapsedCategories: newCollapsed });
    };

    const handlePrivateUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        const hash = simpleHash(privatePassword);
        if (config.privateConfig && hash === config.privateConfig.passwordHash) {
            setIsPrivateUnlocked(true);
            setPrivateError(false);
            setPrivatePassword('');
        } else {
            setPrivateError(true);
        }
    };

    const handlePrivateLock = () => {
        setIsPrivateUnlocked(false);
        setPrivatePassword('');
        setIsPrivateExpanded(false);
    };

    // --- Bookmark Drag Handlers ---
    const handleBookmarkDragStart = useCallback((e: React.DragEvent, id: string, group: string) => {
        setDraggedId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.setData('group', group);
        e.dataTransfer.setData('type', 'BOOKMARK'); 
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation(); 

        // Create a custom drag image with reduced opacity
        const target = e.currentTarget as HTMLElement;
        const clone = target.cloneNode(true) as HTMLElement;
        clone.style.opacity = '0.7';
        clone.style.transform = 'scale(0.9)';
        clone.style.position = 'absolute';
        clone.style.top = '-9999px';
        document.body.appendChild(clone);
        e.dataTransfer.setDragImage(clone, clone.offsetWidth / 2, clone.offsetHeight / 2);
        setTimeout(() => document.body.removeChild(clone), 0);
    }, []);

    const handleBookmarkDragOver = useCallback((e: React.DragEvent, targetId: string, _group: string, rect: DOMRect) => {
        if (!draggedId || draggedId === targetId) {
            setDropTargetId(null);
            setDropSide(null);
            return;
        }
        
        // Calculate which side the cursor is on
        const midX = rect.left + rect.width / 2;
        const side = e.clientX < midX ? 'left' : 'right';
        
        setDropTargetId(targetId);
        setDropSide(side);
    }, [draggedId]);

    const handleBookmarkDragLeave = useCallback(() => {
        setDropTargetId(null);
        setDropSide(null);
    }, []);

    const handleDropBookmark = useCallback((e: React.DragEvent, targetId: string, targetGroup: string) => {
        const type = e.dataTransfer.getData('type');
        if (type && type !== 'BOOKMARK') return; 

        e.preventDefault();
        e.stopPropagation();
        
        const draggedIdRaw = e.dataTransfer.getData('text/plain') || draggedId;
        const sourceGroup = e.dataTransfer.getData('group');

        // Reset visual states
        setDraggedId(null);
        setDropTargetId(null);
        setDropSide(null);

        if (!draggedIdRaw) return;
        if (draggedIdRaw === targetId) return;
        if (sourceGroup && sourceGroup !== targetGroup) return;

        // --- INSERT-BASED REORDER LOGIC ---
        const allBookmarks = [...config.bookmarks];
        let groupItems: Bookmark[] = [];
        let otherItems: Bookmark[] = [];

        if (targetGroup === 'favorites') {
             groupItems = allBookmarks.filter(b => b.isFavorite && b.category !== 'Private');
             otherItems = allBookmarks.filter(b => !(b.isFavorite && b.category !== 'Private'));
        } else {
             groupItems = allBookmarks.filter(b => !b.isFavorite && (b.category || 'General') === targetGroup);
             otherItems = allBookmarks.filter(b => b.isFavorite || (b.category || 'General') !== targetGroup);
        }

        const oldIndex = groupItems.findIndex(b => b.id === draggedIdRaw);
        const targetIndex = groupItems.findIndex(b => b.id === targetId);

        if (oldIndex === -1 || targetIndex === -1) return;

        // Remove dragged item
        const [movedItem] = groupItems.splice(oldIndex, 1);
        
        // Recalculate target index after removal
        const newTargetIndex = groupItems.findIndex(b => b.id === targetId);
        
        // Insert based on drop side
        if (dropSide === 'right') {
            groupItems.splice(newTargetIndex + 1, 0, movedItem);
        } else {
            groupItems.splice(newTargetIndex, 0, movedItem);
        }

        const newBookmarks = [...otherItems, ...groupItems];
        onUpdate({ ...config, bookmarks: newBookmarks });
    }, [config, draggedId, dropSide, onUpdate]);

    const handleDragEnd = useCallback(() => {
        setDraggedId(null);
        setDropTargetId(null);
        setDropSide(null);
    }, []);

    // --- Category Drag Handlers ---
    const handleCategoryDragStart = (e: React.DragEvent, catName: string) => {
        if (isLocked) {
             e.preventDefault();
             return;
        }
        
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.closest('button') || target.tagName === 'INPUT') {
            e.preventDefault();
            return;
        }

        setDraggedCategory(catName);
        e.dataTransfer.setData('type', 'CATEGORY');
        e.dataTransfer.setData('catName', catName);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleCategoryDrop = (e: React.DragEvent, targetCatName: string) => {
        const type = e.dataTransfer.getData('type');
        if (type !== 'CATEGORY') return;

        e.preventDefault();
        e.stopPropagation();
        setDraggedCategory(null);

        const sourceCatName = e.dataTransfer.getData('catName');
        if (sourceCatName === targetCatName) return;

        const currentOrder = config.categoryOrder && config.categoryOrder.length > 0 
            ? [...config.categoryOrder] 
            : [...sortedCategories];

        if (!currentOrder.includes(sourceCatName)) currentOrder.push(sourceCatName);
        if (!currentOrder.includes(targetCatName)) currentOrder.push(targetCatName);

        const oldIndex = currentOrder.indexOf(sourceCatName);
        const newIndex = currentOrder.indexOf(targetCatName);

        if (oldIndex > -1 && newIndex > -1) {
            currentOrder.splice(oldIndex, 1);
            currentOrder.splice(newIndex, 0, sourceCatName);
            onUpdate({ ...config, categoryOrder: currentOrder });
        }
    };

    const getGridTemplate = (size: BookmarkSize) => {
        let min = '120px';
        if (size === 'icon') min = '70px';
        else if (size === 'small') min = '100px';
        else if (size === 'large') min = '140px';
        return `repeat(auto-fill, minmax(${min}, 1fr))`;
    };

    return (
        <div className="w-full space-y-8 animate-fade-in-up" onDragEnd={handleDragEnd}>
            {/* Favorites Section */}
            {favorites.length > 0 && (
                <div>
                     <div className="flex items-center gap-3 mb-3 group select-none">
                        <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 flex items-center gap-2" style={{ color: config.theme.textColor }}>
                            <Star size={12} fill="currentColor" /> Favorites
                        </h3>
                    </div>
                    <div 
                        className="grid gap-4"
                        style={{ gridTemplateColumns: getGridTemplate(config.globalBookmarkSize) }}
                    >
                        {favorites.map((b, idx) => (
                            <BookmarkCard 
                                key={b.id} 
                                bookmark={b} 
                                index={idx}
                                isFav={true} 
                                config={config}
                                size={config.globalBookmarkSize}
                                isDragged={draggedId === b.id}
                                isDropTarget={dropTargetId === b.id}
                                dropSide={dropTargetId === b.id ? dropSide : null}
                                onDragStart={handleBookmarkDragStart}
                                onDragOver={handleBookmarkDragOver}
                                onDragLeave={handleBookmarkDragLeave}
                                onDrop={handleDropBookmark}
                            />
                        ))}
                    </div>
                </div>
            )}

            {sortedCategories.map(cat => {
                const catSize = config.categoryBookmarkSizes[cat] || config.globalBookmarkSize;
                const isCollapsed = collapsedCats.includes(cat);
                const isCategoryDragged = draggedCategory === cat;
                const isPrivate = cat === 'Private';
                
                return (
                    <div 
                        key={cat} 
                        className={`transition-all duration-300 ease-out will-change-transform ${isCategoryDragged ? 'opacity-40 scale-[0.99] blur-[2px]' : ''}`}
                        draggable={!isLocked}
                        onDragStart={(e) => handleCategoryDragStart(e, cat)}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDrop={(e) => handleCategoryDrop(e, cat)}
                    >
                        {/* Header */}
                        <div className={`flex items-center gap-3 mb-3 group select-none w-full ${!isLocked ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                            <h3 
                                className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-opacity ${isCollapsed ? 'opacity-30' : 'opacity-50'}`} 
                                style={{ color: config.theme.textColor }}
                            >
                                {isPrivate ? (isPrivateUnlocked ? <Unlock size={12} /> : <Lock size={12} />) : <Tag size={12} />}
                                {cat}
                            </h3>
                            
                             {isPrivate ? (
                                <button
                                    onClick={() => {
                                        if (isPrivateUnlocked) {
                                            handlePrivateLock();
                                        } else {
                                            setIsPrivateExpanded(!isPrivateExpanded);
                                            setPrivateError(false);
                                        }
                                    }}
                                    style={{ color: config.theme.textColor }}
                                    className={`transition-all duration-200 opacity-50 hover:opacity-100`}
                                    title={isPrivateUnlocked ? "Lock" : "Unlock"}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {isPrivateUnlocked ? <Lock size={14} /> : (isPrivateExpanded ? <EyeOff size={14} /> : <Eye size={14} />)}
                                </button>
                             ) : (
                                <button
                                    onClick={() => toggleCategory(cat)}
                                    style={{ color: config.theme.textColor }}
                                    className={`transition-all duration-200 ${
                                        isCollapsed 
                                        ? 'opacity-50 hover:opacity-100' 
                                        : 'opacity-0 group-hover:opacity-50 hover:!opacity-100'
                                    }`}
                                    title={isCollapsed ? "Show category" : "Hide category"}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {isCollapsed ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                             )}

                            <div className={`flex-1 h-px bg-current ml-2 transition-opacity ${!isLocked ? 'opacity-0 group-hover:opacity-20' : 'opacity-0'}`}></div>
                        </div>
                        
                        {isPrivate && (
                            <>
                                {isPrivateExpanded && !isPrivateUnlocked && (
                                    <form onSubmit={handlePrivateUnlock} className="animate-fade-in flex items-center gap-2 max-w-xs mb-4 pl-1">
                                        <div className="relative flex-1">
                                            <input 
                                                type="password" 
                                                value={privatePassword}
                                                onChange={(e) => { setPrivatePassword(e.target.value); setPrivateError(false); }}
                                                placeholder="Enter password"
                                                className={`w-full bg-transparent border-b py-1 px-2 text-sm outline-none placeholder-opacity-50 transition-colors ${privateError ? 'border-red-500 text-red-500 placeholder-red-300' : 'border-neutral-500/30 focus:border-neutral-500'}`}
                                                style={{ color: privateError ? undefined : config.theme.textColor }}
                                                autoFocus
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            className="p-1 rounded hover:bg-white/10 transition-colors"
                                            style={{ color: config.theme.textColor }}
                                        >
                                            <ArrowRight size={16} />
                                        </button>
                                    </form>
                                )}
                            </>
                        )}

                        {(!isCollapsed && (!isPrivate || isPrivateUnlocked)) && (
                            <div 
                                className="grid gap-4 animate-fade-in"
                                style={{ gridTemplateColumns: getGridTemplate(catSize) }}
                            >
                                {categories[cat].map((b, idx) => (
                                    <BookmarkCard 
                                        key={b.id} 
                                        bookmark={b} 
                                        index={idx}
                                        config={config}
                                        size={catSize}
                                        isDragged={draggedId === b.id}
                                        isDropTarget={dropTargetId === b.id}
                                        dropSide={dropTargetId === b.id ? dropSide : null}
                                        onDragStart={!isPrivate ? handleBookmarkDragStart : undefined}
                                        onDragOver={!isPrivate ? handleBookmarkDragOver : undefined}
                                        onDragLeave={!isPrivate ? handleBookmarkDragLeave : undefined}
                                        onDrop={!isPrivate ? handleDropBookmark : undefined}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
