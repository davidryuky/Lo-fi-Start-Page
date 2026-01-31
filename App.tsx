
import React, { useEffect, useState, Suspense, lazy, useCallback } from 'react';
import { Settings, Plus, Loader } from 'lucide-react';
import { AppConfig, WidgetLayout } from './types';
import { DEFAULT_CONFIG } from './constants';
import { Clock } from './components/Clock';
import { SearchBar } from './components/SearchBar';
import { BookmarkGrid } from './components/BookmarkGrid';
// Lazy load SettingsModal to reduce initial bundle execution time and render cost
const SettingsModal = lazy(() => import('./components/SettingsModal').then(module => ({ default: module.SettingsModal })));
import { TodoList } from './components/TodoList';
import { QuoteWidget } from './components/QuoteWidget';
import { WeatherWidget } from './components/WeatherWidget';
import { PomodoroTimer } from './components/PomodoroTimer';
import { NotesWidget } from './components/NotesWidget';
import { DraggableWidget } from './components/DraggableWidget';
import { CryptoTicker } from './components/CryptoTicker';
import { BreathingExercise } from './components/BreathingExercise';
import { getFontFamily } from './utils';
import { usePersistedState } from './utils/hooks';

const CONFIG_STORAGE_KEY = 'lofi_start_config_v1';

const App: React.FC = () => {
  // Use custom hook for optimized storage
  const [config, setConfig] = usePersistedState<AppConfig>(CONFIG_STORAGE_KEY, DEFAULT_CONFIG, 1000);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // Background Media State
  const [resolvedBg, setResolvedBg] = useState<{ type: 'image' | 'video', url: string } | null>(null);

  // DnD State
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [draggedWidgetSection, setDraggedWidgetSection] = useState<string | null>(null);
  
  // New State: Triggered immediately when long-press completes, before drag starts
  const [isDragMode, setIsDragMode] = useState(false);

  // Initial Load Migration Logic
  useEffect(() => {
    setLoaded(true);
  }, []);

  // Handle Random Media Fetching
  useEffect(() => {
    const bgSetting = config.theme.backgroundImage;

    if (bgSetting === 'random_harsh_bin') {
         const repoUrl = 'https://harsh-bin.github.io/wallpaper-api';
         
         fetch(`${repoUrl}/random_media_list.json`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load media list');
                return response.json();
            })
            .then(data => {
                const mediaFiles = data.media;
                if (!mediaFiles || mediaFiles.length === 0) throw new Error('Empty media list');

                const randomIndex = Math.floor(Math.random() * mediaFiles.length);
                const randomMediaFile = mediaFiles[randomIndex];
                const mediaUrl = `${repoUrl}/${randomMediaFile}`;
                
                const isVideo = randomMediaFile.endsWith('.mp4') || randomMediaFile.endsWith('.webm');
                setResolvedBg({
                    type: isVideo ? 'video' : 'image',
                    url: mediaUrl
                });
            })
            .catch(err => {
                console.error("Random background fetch failed:", err);
                // Fallback to a static image
                setResolvedBg({ type: 'image', url: 'https://loremflickr.com/1920/1080/lofi' });
            });
    } else if (bgSetting && bgSetting !== '') {
        // It's a direct URL (Custom or other presets)
        setResolvedBg({ type: 'image', url: bgSetting });
    } else {
        // No background
        setResolvedBg(null);
    }

  }, [config.theme.backgroundImage]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Toggle Zen Mode with 'Z' if not typing in an input
        if (e.key.toLowerCase() === 'z' && 
            document.activeElement?.tagName !== 'INPUT' && 
            document.activeElement?.tagName !== 'TEXTAREA') {
            setConfig(prev => ({ ...prev, zenMode: !prev.zenMode }));
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setConfig]);

  // Main Container Style
  const containerStyle: React.CSSProperties = {
    backgroundColor: config.theme.backgroundColor,
    color: config.theme.textColor,
    fontFamily: getFontFamily(config.theme.font),
    minHeight: '100vh',
    transition: 'background-color 0.5s ease, color 0.5s ease',
  };

  const contentWrapperStyle: React.CSSProperties = {
    backdropFilter: resolvedBg ? `blur(${config.theme.blurLevel}px)` : 'none',
    backgroundColor: resolvedBg 
      ? `${config.theme.backgroundColor}${Math.round(config.theme.opacityLevel * 255).toString(16).padStart(2,'0')}` 
      : 'transparent',
  };

  // Drag Handlers using useCallback to prevent re-creation
  const handleDragStart = useCallback((e: React.DragEvent, id: string, section: string) => {
    if (config.lockLayout || config.zenMode) return;
    setDraggedWidgetId(id);
    setDraggedWidgetSection(section);
    e.dataTransfer.effectAllowed = 'move';
  }, [config.lockLayout, config.zenMode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Remove Widget Handler
  const handleRemoveWidget = useCallback((id: string) => {
      const newConfig = { ...config };
      
      // Disable in config
      if (id in newConfig && typeof (newConfig as any)[id] === 'object') {
          (newConfig as any)[id].enabled = false;
      }

      // Remove from all layout arrays
      const sections: (keyof WidgetLayout)[] = ['header', 'sidebar', 'topLeft', 'topRight'];
      sections.forEach(sec => {
          newConfig.layout[sec] = newConfig.layout[sec].filter(wId => wId !== id);
      });

      setConfig(newConfig);
  }, [config, setConfig]);

  // REFINED SWAP LOGIC
  const handleDrop = useCallback((e: React.DragEvent, targetId: string | null, targetSection: string) => {
    e.preventDefault();
    setIsDragMode(false); // Reset drag mode visual
    
    if (config.lockLayout || config.zenMode) return;
    if (!draggedWidgetId) return;

    // Dropped on itself
    if (draggedWidgetId === targetId) {
        setDraggedWidgetId(null);
        setDraggedWidgetSection(null);
        return;
    }

    const newLayout: WidgetLayout = JSON.parse(JSON.stringify(config.layout));
    
    const sourceKey = draggedWidgetSection as keyof WidgetLayout;
    const sourceList = newLayout[sourceKey] as string[];
    
    const targetKey = targetSection as keyof WidgetLayout;
    const targetList = newLayout[targetKey] as string[];

    const sourceIndex = sourceList.indexOf(draggedWidgetId);
    if (sourceIndex === -1) return;

    // --- LOGIC SPLIT: SWAP vs APPEND ---

    if (targetId) {
        // Case 1: Dropped ON an existing widget (SWAP)
        const targetIndex = targetList.indexOf(targetId);
        
        if (targetIndex > -1) {
            if (sourceKey === targetKey) {
                // Same list swap
                sourceList[sourceIndex] = targetId;
                sourceList[targetIndex] = draggedWidgetId;
            } else {
                // Cross list swap
                sourceList.splice(sourceIndex, 1, targetId); // Put target where source was
                targetList.splice(targetIndex, 1, draggedWidgetId); // Put source where target was
            }
        }
    } else {
        // Case 2: Dropped on a "Plus" Zone (APPEND)
        // Check if we are appending to the same list we came from (reordering to end)
        if (sourceKey === targetKey) {
             sourceList.splice(sourceIndex, 1);
             sourceList.push(draggedWidgetId);
        } else {
             // Moving from one list to end of another
             sourceList.splice(sourceIndex, 1);
             targetList.push(draggedWidgetId);
        }
    }

    setConfig(prev => ({ ...prev, layout: newLayout }));
    setDraggedWidgetId(null);
    setDraggedWidgetSection(null);
  }, [config.layout, config.lockLayout, config.zenMode, draggedWidgetId, draggedWidgetSection, setConfig]);

  // Render Helper
  const renderWidget = (id: string, section: 'header' | 'sidebar' | 'topLeft' | 'topRight') => {
    let component = null;

    switch (id) {
      case 'weather':
        if (!config.weather.enabled) return null;
        component = <WeatherWidget config={config.weather} theme={config.theme} />;
        break;
      case 'todo':
        if (!config.todo.enabled) return null;
        component = <TodoList config={config} onUpdate={setConfig} />;
        break;
      case 'pomodoro':
        if (!config.pomodoro.enabled) return null;
        component = <PomodoroTimer config={config.pomodoro} theme={config.theme} />;
        break;
      case 'notes':
        if (!config.notes.enabled) return null;
        component = <NotesWidget config={config} onUpdate={setConfig} />;
        break;
      case 'crypto':
        if (!config.crypto.enabled) return null;
        component = <CryptoTicker config={config.crypto} theme={config.theme} />;
        break;
      case 'breathing':
        if (!config.breathing.enabled) return null;
        component = <BreathingExercise config={config.breathing} theme={config.theme} />;
        break;
      default:
        return null;
    }

    return (
      <DraggableWidget
        key={id}
        id={id}
        section={section}
        isDragged={draggedWidgetId === id}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onRemove={handleRemoveWidget}
        locked={config.lockLayout || config.zenMode}
        onDragModeChange={setIsDragMode}
      >
        {component}
      </DraggableWidget>
    );
  };

  const hasSidebarWidgets = config.layout.sidebar.some(id => {
      if (config.layout.sidebar.length === 0) return false;
      if (id === 'weather' && config.weather.enabled) return true;
      if (id === 'todo' && config.todo.enabled) return true;
      if (id === 'pomodoro' && config.pomodoro.enabled) return true;
      if (id === 'notes' && config.notes.enabled) return true;
      if (id === 'crypto' && config.crypto.enabled) return true;
      if (id === 'breathing' && config.breathing.enabled) return true;
      return false;
  });

  const showDropZones = !config.lockLayout && !config.zenMode && (isDragMode || draggedWidgetId !== null);

  if (!loaded) return null;

  return (
    <div style={containerStyle} className="relative w-full overflow-x-hidden">
      
      {resolvedBg && (
        <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
            {resolvedBg.type === 'video' ? (
                <video src={resolvedBg.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
                <img src={resolvedBg.url} alt="Background" className="w-full h-full object-cover" />
            )}
        </div>
      )}

      <div 
        className="min-h-screen w-full flex flex-col items-center p-4 lg:p-8 transition-all duration-500 overflow-y-auto relative z-10"
        style={resolvedBg ? contentWrapperStyle : {}}
      >
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={`absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-all duration-500 z-10 hover:opacity-100 ${config.zenMode ? 'opacity-0' : 'opacity-50'}`}
          style={{ color: config.theme.textColor }}
          aria-label="Settings"
        >
          <Settings size={24} />
        </button>

        <div className={`w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6 items-start transition-all duration-1000 ${config.zenMode ? 'mt-[30vh] scale-110' : 'mt-8 mb-8'}`}>
            
            <div className={`hidden lg:flex flex-col gap-4 mt-12 transition-opacity duration-700 ${config.zenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {config.layout.topLeft.map(id => renderWidget(id, 'topLeft'))}
                
                {/* Always show drop zone if in drag mode, allowing unlimited widgets */}
                {showDropZones && (
                    <div 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, null, 'topLeft')}
                        className={`w-full h-24 border-2 border-dashed rounded-xl flex items-center justify-center transition-all duration-300 opacity-70 bg-white/5 border-emerald-400/50 animate-pulse`}
                        style={{ borderColor: config.theme.accentColor }}
                        title="Add to Top Left"
                    >
                        <Plus className="opacity-50" />
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center z-0 w-full">
                <Clock config={config.clock} theme={config.theme} username={config.username} />

                <div className={`transition-opacity duration-700 w-full flex flex-col items-center gap-6 ${config.zenMode ? (config.clock.enabled ? 'mt-8' : '') : ''}`}>
                    {!config.zenMode && config.layout.header.map(id => renderWidget(id, 'header'))}
                    
                    {/* Header Drop Zone */}
                    {showDropZones && (
                         <div 
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, null, 'header')}
                            className="w-full h-16 border-2 border-dashed rounded-xl flex items-center justify-center transition-all duration-300 opacity-70 bg-white/5 border-emerald-400/50 animate-pulse"
                            style={{ borderColor: config.theme.accentColor }}
                            title="Add to Header"
                        >
                             <Plus className="opacity-50" />
                        </div>
                    )}
                    
                    {!config.zenMode && <QuoteWidget config={config.quote} theme={config.theme} />}
                    <div className={`${config.zenMode ? 'opacity-50 hover:opacity-100 transition-opacity' : ''} w-full flex justify-center max-w-xl`}>
                        <SearchBar config={config.search} theme={config.theme} />
                    </div>
                </div>
            </div>

             <div className={`hidden lg:flex flex-col gap-4 mt-12 transition-opacity duration-700 ${config.zenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {config.layout.topRight.map(id => renderWidget(id, 'topRight'))}

                {/* Always show drop zone if in drag mode */}
                {showDropZones && (
                    <div 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, null, 'topRight')}
                        className={`w-full h-24 border-2 border-dashed rounded-xl flex items-center justify-center transition-all duration-300 opacity-70 bg-white/5 border-emerald-400/50 animate-pulse`}
                        style={{ borderColor: config.theme.accentColor }}
                        title="Add to Top Right"
                    >
                         <Plus className="opacity-50" />
                    </div>
                )}
            </div>
            
            {/* Mobile View Layout */}
            <div className="lg:hidden w-full flex flex-col gap-4 order-last">
                 {config.layout.topLeft.map(id => renderWidget(id, 'topLeft'))}
                 {config.layout.topRight.map(id => renderWidget(id, 'topRight'))}
            </div>

        </div>

        <div className={`w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8 z-0 pb-12 transition-all duration-700 ${config.zenMode ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100'}`}>
          <div className={hasSidebarWidgets ? 'lg:col-span-3' : 'lg:col-span-4'}>
             <BookmarkGrid config={config} onUpdate={setConfig} />
          </div>

          <div className={`lg:col-span-1 flex flex-col gap-6 ${hasSidebarWidgets || showDropZones ? 'block' : 'hidden'}`}>
               {config.layout.sidebar.map(id => renderWidget(id, 'sidebar'))}
               
               {/* Sidebar Drop Zone */}
               {showDropZones && (
                    <div 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, null, 'sidebar')}
                        className="w-full h-24 border-2 border-dashed rounded-xl flex items-center justify-center transition-all duration-300 opacity-70 bg-white/5 border-emerald-400/50 animate-pulse"
                        style={{ borderColor: config.theme.accentColor }}
                        title="Add to Sidebar"
                    >
                        <Plus className="opacity-50" />
                    </div>
               )}
          </div>
        </div>

        <footer className={`w-full text-center py-4 text-xs opacity-30 select-none mt-auto transition-opacity duration-500 ${config.zenMode ? 'opacity-0' : ''}`}>
          Lo-Fi Start
        </footer>

      </div>

      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Loader className="animate-spin text-white" />
        </div>
      }>
          {isSettingsOpen && (
            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                config={config}
                onUpdate={setConfig}
            />
          )}
      </Suspense>
    </div>
  );
};

export default App;
