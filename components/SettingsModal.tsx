
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { X, Upload, Download, Trash2, Plus, Star, Layout, Palette, Monitor, Bookmark as BookmarkIcon, Database, Image as ImageIcon, Cloud, Clock, Search, ListChecks, Lock, Sparkles, Timer, StickyNote, EyeOff, Shield, ArrowRight, LogOut, Bitcoin, Wind, MapPin, Loader, Shuffle, ChevronRight, Check, BookOpen, Keyboard, MousePointer2, Grid, Link, User, RefreshCw, AlertCircle, Terminal, Copy, ExternalLink, Save, HardDrive, Unlock, Tag } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { AppConfig, Bookmark, FontType, SearchEngine, ThemeConfig, BookmarkSize, WidgetStyle } from '../types';
import { DEFAULT_CONFIG, SEARCH_ENGINES, LOFI_THEMES, BACKGROUND_CATEGORIES } from '../constants';
import { simpleHash } from '../utils';
import { WidgetStyler } from './settings/WidgetStyler';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onUpdate: (newConfig: AppConfig) => void;
}

type TabType = 'general' | 'background' | 'presets' | 'widgets' | 'appearance' | 'bookmarks' | 'data' | 'private' | 'cloud' | 'help';

// --- HELPER COMPONENTS ---

const NavItem = ({ id, label, icon: Icon, activeTab, setActiveTab }: { id: TabType, label: string, icon: any, activeTab: TabType, setActiveTab: (t: TabType) => void }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl mb-1
        ${activeTab === id 
          ? 'bg-neutral-100 text-neutral-900 shadow-sm' 
          : 'text-neutral-600 hover:bg-white hover:text-neutral-900'
        }`}
    >
      <Icon size={18} strokeWidth={activeTab === id ? 2.5 : 2} />
      <span>{label}</span>
      {activeTab === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neutral-900"></div>}
    </button>
);

const SectionTitle = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-8">
        <h3 className="text-3xl font-bold text-neutral-900 tracking-tight mb-2">{title}</h3>
        <p className="text-neutral-600 font-medium">{desc}</p>
    </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
        {...props}
        className={`w-full p-3 bg-neutral-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-neutral-200 focus:border-neutral-300 outline-none transition-all text-sm font-medium placeholder-neutral-500 text-neutral-800 ${props.className || ''}`}
    />
);

const Toggle = ({ checked, onChange, label, subLabel, icon: Icon }: { checked: boolean, onChange: (v: boolean) => void, label: string, subLabel?: string, icon?: any }) => (
    <label className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-2xl cursor-pointer hover:border-neutral-300 transition-all shadow-sm group">
        <div className="flex items-center gap-4">
            {Icon && (
                <div className={`p-2.5 rounded-xl transition-colors ${checked ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'}`}>
                    <Icon size={20} />
                </div>
            )}
            <div className="flex flex-col">
                <span className="text-sm font-bold text-neutral-800">{label}</span>
                {subLabel && <span className="text-xs text-neutral-500 font-medium">{subLabel}</span>}
            </div>
        </div>
        <div className="relative inline-block w-12 h-7 shrink-0">
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={(e) => onChange(e.target.checked)} 
                className="peer opacity-0 w-full h-full absolute cursor-pointer"
            />
            <div className={`w-12 h-7 rounded-full transition-colors duration-300 ${checked ? 'bg-neutral-900' : 'bg-neutral-200'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300 ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
    </label>
);

// --- MAIN COMPONENT ---

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [activeWidgetTab, setActiveWidgetTab] = useState<'clock'|'search'|'todo'|'quote'|'weather'|'pomodoro'|'notes'|'crypto'|'breathing'>('clock');
  
  // Weather Search State
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [searchingCity, setSearchingCity] = useState(false);
  const [searchTimer, setSearchTimer] = useState<number | null>(null);

  // Bookmark Form State
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkUrl, setNewBookmarkUrl] = useState('');
  const [newBookmarkCategory, setNewBookmarkCategory] = useState('');
  const [newBookmarkIsFavorite, setNewBookmarkIsFavorite] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Private Category State
  const [privatePasswordInput, setPrivatePasswordInput] = useState('');
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);
  const [privateError, setPrivateError] = useState('');
  const [newPrivateLinkUrl, setNewPrivateLinkUrl] = useState('');
  const [newPrivateLinkTitle, setNewPrivateLinkTitle] = useState('');

  // Sync State
  const [supabaseUrl, setSupabaseUrl] = useState(config.supabaseConfig?.url || '');
  const [supabaseKey, setSupabaseKey] = useState(config.supabaseConfig?.key || '');
  const [syncPassword, setSyncPassword] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (!isOpen) {
          setIsPrivateUnlocked(false);
          setPrivatePasswordInput('');
          setPrivateError('');
          setCityResults([]);
          setCityQuery('');
          setSyncMessage('');
          setSyncStatus('idle');
          setShowSetup(false);
      } else {
           setSupabaseUrl(config.supabaseConfig?.url || '');
           setSupabaseKey(config.supabaseConfig?.key || '');
      }
  }, [isOpen]);

  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    config.bookmarks.forEach(b => {
        if (b.category && b.category.trim() !== '') {
            cats.add(b.category.trim());
        }
    });
    return Array.from(cats).sort();
  }, [config.bookmarks]);

  const privateBookmarks = config.bookmarks.filter(b => b.category === 'Private');

  const WIDGET_LIST = [
      { id: 'clock', icon: Clock, label: 'Clock', enabled: config.clock.enabled },
      { id: 'search', icon: Search, label: 'Search', enabled: true },
      { id: 'todo', icon: ListChecks, label: 'Todo', enabled: config.todo.enabled },
      { id: 'crypto', icon: Bitcoin, label: 'Crypto', enabled: config.crypto.enabled },
      { id: 'breathing', icon: Wind, label: 'Breath', enabled: config.breathing.enabled },
      { id: 'pomodoro', icon: Timer, label: 'Pomodoro', enabled: config.pomodoro.enabled },
      { id: 'notes', icon: StickyNote, label: 'Notes', enabled: config.notes.enabled },
      { id: 'quote', icon: Sparkles, label: 'Quote', enabled: config.quote.enabled },
      { id: 'weather', icon: Cloud, label: 'Weather', enabled: config.weather.enabled }
  ];

  const SETUP_SQL = `-- Run this in the SQL EDITOR (Not Import Data)
-- 1. Create table
create table if not exists public.user_configs (
  id text primary key, 
  user_id uuid,
  config_data jsonb,
  updated_at timestamptz default now()
);

-- 2. Enable Security
alter table public.user_configs enable row level security;

-- 3. Allow access (App handles security via logic or auth)
create policy "Allow access" on public.user_configs for all using (true) with check (true);
`;

  if (!isOpen) return null;

  // --- Handlers ---
  const updateTheme = (updates: Partial<ThemeConfig>) => {
    onUpdate({
      ...config,
      theme: { ...config.theme, ...updates }
    });
  };

  const handleApplyPreset = (presetName: keyof typeof LOFI_THEMES) => {
    const preset = LOFI_THEMES[presetName];
    updateTheme({ 
        ...preset, 
        font: preset.font as FontType 
    });
  };

  const handleRandomize = () => {
    const randomHex = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    const fonts: FontType[] = ['sans', 'serif', 'mono'];
    const radii = ['0px', '4px', '8px', '12px', '16px', '99px'];

    updateTheme({
        backgroundColor: randomHex(),
        textColor: randomHex(),
        accentColor: randomHex(),
        backgroundImage: '',
        font: fonts[Math.floor(Math.random() * fonts.length)],
        borderRadius: radii[Math.floor(Math.random() * radii.length)],
        blurLevel: Math.floor(Math.random() * 12),
        opacityLevel: Math.random() * 0.4 + 0.6
    });
  };

  const toggleWidgetEnabled = (widgetKey: keyof AppConfig, enabled: boolean) => {
    const updatedConfig = JSON.parse(JSON.stringify(config));
    
    if (updatedConfig[widgetKey] && typeof updatedConfig[widgetKey] === 'object') {
         updatedConfig[widgetKey].enabled = enabled;
    }

    const dynamicWidgets = ['weather', 'pomodoro', 'todo', 'notes', 'crypto', 'breathing'];
    
    if (dynamicWidgets.includes(widgetKey as string)) {
        const id = widgetKey as string;
        
        const existsInHeader = updatedConfig.layout.header.includes(id);
        const existsInSidebar = updatedConfig.layout.sidebar.includes(id);
        const existsInTopLeft = updatedConfig.layout.topLeft.includes(id); 
        const existsInTopRight = updatedConfig.layout.topRight.includes(id); 
        
        const existsAnywhere = existsInHeader || existsInSidebar || existsInTopLeft || existsInTopRight;

        if (enabled) {
            if (!existsAnywhere) {
                updatedConfig.layout.sidebar.push(id);
            }
        }
    }
    
    onUpdate(updatedConfig);
  };

  const handleCitySearch = (query: string) => {
      setCityQuery(query);
      if (searchTimer) clearTimeout(searchTimer);
      if (query.length < 3) {
          setCityResults([]);
          return;
      }
      setSearchingCity(true);
      const timer = window.setTimeout(async () => {
          try {
              const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
              const data = await res.json();
              setCityResults(data.results || []);
          } catch (e) {
              setCityResults([]);
          } finally {
              setSearchingCity(false);
          }
      }, 500);
      setSearchTimer(timer);
  };

  const selectCity = (result: any) => {
      onUpdate({
          ...config,
          weather: {
              ...config.weather,
              city: result.name,
              latitude: result.latitude,
              longitude: result.longitude
          }
      });
      setCityQuery('');
      setCityResults([]);
  };

  const addBookmark = () => {
    if (!newBookmarkTitle || !newBookmarkUrl) return;
    let url = newBookmarkUrl;
    if (!url.startsWith('http')) url = `https://${url}`;

    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      title: newBookmarkTitle,
      url: url,
      isFavorite: newBookmarkIsFavorite,
      category: newBookmarkCategory.trim() || 'General',
    };

    onUpdate({ ...config, bookmarks: [...config.bookmarks, newBookmark] });
    setNewBookmarkTitle('');
    setNewBookmarkUrl('');
    setNewBookmarkCategory('');
    setNewBookmarkIsFavorite(false);
    setIsCreatingCategory(false);
  };

  const removeBookmark = (id: string) => {
    onUpdate({ ...config, bookmarks: config.bookmarks.filter(b => b.id !== id) });
  };

  const toggleFavorite = (id: string) => {
    const updated = config.bookmarks.map(b => 
       b.id === id ? { ...b, isFavorite: !b.isFavorite } : b
    );
    onUpdate({ ...config, bookmarks: updated });
  };

  const handleUnlockPrivate = () => {
      if (!config.privateConfig?.passwordHash) {
          if (!privatePasswordInput) {
            setPrivateError('Password cannot be empty');
            return;
          }
          const hash = simpleHash(privatePasswordInput);
          onUpdate({ ...config, privateConfig: { enabled: true, passwordHash: hash } });
          setIsPrivateUnlocked(true);
          setPrivatePasswordInput('');
          setPrivateError('');
      } else {
          const hash = simpleHash(privatePasswordInput);
          if (hash === config.privateConfig.passwordHash) {
              setIsPrivateUnlocked(true);
              setPrivatePasswordInput('');
              setPrivateError('');
          } else {
              setPrivateError('Incorrect password');
          }
      }
  };

  const addPrivateBookmark = () => {
      if (!newPrivateLinkUrl || !newPrivateLinkTitle) return;
      let url = newPrivateLinkUrl;
      if (!url.startsWith('http')) url = `https://${url}`;

      const newBookmark: Bookmark = {
          id: Date.now().toString(),
          title: newPrivateLinkTitle,
          url: url,
          isFavorite: false,
          category: 'Private'
      };
      onUpdate({ ...config, bookmarks: [...config.bookmarks, newBookmark] });
      setNewPrivateLinkUrl('');
      setNewPrivateLinkTitle('');
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lofi_start_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.theme && json.bookmarks) {
          onUpdate({ ...DEFAULT_CONFIG, ...json }); 
          alert('Configuration loaded successfully!');
        } else {
            alert('Invalid configuration file.');
        }
      } catch (err) {
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetToDefault = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      const resetConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      onUpdate(resetConfig);
    }
  };

  const handleBackgroundPresetChange = (value: string) => {
      if (value === 'custom') {
          updateTheme({ backgroundImage: '' });
      } else {
          updateTheme({ backgroundImage: value });
      }
  };

  const updateCategorySize = (category: string, size: BookmarkSize) => {
      onUpdate({
          ...config,
          categoryBookmarkSizes: { ...config.categoryBookmarkSizes, [category]: size }
      });
  };

  const getStyleDefaults = (defaultWidgetConfig: WidgetStyle) => ({
      backgroundColor: defaultWidgetConfig.backgroundColor,
      textColor: defaultWidgetConfig.textColor,
      blurLevel: defaultWidgetConfig.blurLevel,
      opacityLevel: defaultWidgetConfig.opacityLevel
  });

  const copySql = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setSyncMessage('SQL copied to clipboard!');
    setSyncStatus('success');
    setTimeout(() => setSyncMessage(''), 3000);
  };

  const getSupabaseProjectRef = (url: string) => {
      try {
          if (!url) return null;
          const hostname = new URL(url).hostname;
          return hostname.split('.')[0];
      } catch {
          return null;
      }
  };

  // --- LOCAL CREDENTIALS MANAGER ---
  const saveLocalCredentials = () => {
      try {
          const creds = { url: supabaseUrl, key: supabaseKey, pass: syncPassword };
          localStorage.setItem('lofi_supa_creds', JSON.stringify(creds));
          setSyncMessage('Credentials saved to browser!');
          setSyncStatus('success');
          setTimeout(() => setSyncMessage(''), 3000);
      } catch (e) {
          setSyncMessage('Failed to save locally.');
          setSyncStatus('error');
      }
  };

  const loadLocalCredentials = () => {
      try {
          const saved = localStorage.getItem('lofi_supa_creds');
          if (saved) {
              const creds = JSON.parse(saved);
              if (creds.url) setSupabaseUrl(creds.url);
              if (creds.key) setSupabaseKey(creds.key);
              if (creds.pass) setSyncPassword(creds.pass);
              setSyncMessage('Credentials autofilled!');
              setSyncStatus('success');
          } else {
              setSyncMessage('No saved credentials found.');
              setSyncStatus('error');
          }
          setTimeout(() => setSyncMessage(''), 3000);
      } catch (e) {
          setSyncMessage('Error loading credentials.');
          setSyncStatus('error');
      }
  };

  // --- SUPABASE SYNC LOGIC ---
  const handleSync = async (direction: 'push' | 'pull') => {
      if (!supabaseUrl || !supabaseKey) {
          setSyncMessage('Missing URL or Key');
          setSyncStatus('error');
          return;
      }

      setSyncLoading(true);
      setSyncMessage('');
      setSyncStatus('idle');

      let client;
      try {
        client = createClient(supabaseUrl, supabaseKey);
      } catch (e) {
        setSyncLoading(false);
        setSyncMessage('Invalid URL/Key format');
        setSyncStatus('error');
        return;
      }

      try {
          let userId = 'anon_user'; // Default for public tables
          
          // Auto-Auth Logic if password provided
          if (syncPassword) {
            const email = 'davidryuky@gmail.com'; // Standardized email for personal project
            
            // Try SignIn first
            let { data: authData, error: authError } = await client.auth.signInWithPassword({ 
                email, 
                password: syncPassword 
            });

            // If SignIn fails, try SignUp
            if (authError) {
                 const { data: signUpData, error: signUpError } = await client.auth.signUp({
                     email,
                     password: syncPassword
                 });
                 
                 if (signUpError) {
                     if (signUpError.message.includes("already registered")) {
                         throw new Error("Incorrect backup password.");
                     }
                     // If rate limited or other error
                     throw signUpError;
                 }
                 authData = signUpData;
                 
                 // If email confirmation is required by project settings, session might be null
                 if (!authData.session && !authData.user) {
                     throw new Error("Project requires email confirmation. Check Supabase settings.");
                 }
            }
            
            if (authData.session) {
                userId = authData.session.user.id;
            }
          }

          // DB Operation
          if (direction === 'push') {
              const payload: any = { 
                  id: userId,
                  config_data: config,
                  updated_at: new Date()
              };

              // Fix: 'anon_user' is not a valid UUID. Only set user_id if it's a real user.
              if (userId !== 'anon_user') {
                  payload.user_id = userId;
              } else {
                  payload.user_id = null;
              }

              const { error } = await client
                .from('user_configs')
                .upsert(payload);
                
              if (error) throw error;
              setSyncMessage('Config saved to cloud!');
              setSyncStatus('success');
              
              onUpdate({
                  ...config,
                  supabaseConfig: { ...config.supabaseConfig, url: supabaseUrl, key: supabaseKey, lastSync: new Date().toLocaleString() }
              });
          } 
          else if (direction === 'pull') {
              const { data, error } = await client
                .from('user_configs')
                .select('config_data')
                .eq('id', userId)
                .single();

              if (error) throw error;
              if (data && data.config_data) {
                  const cloudConfig = data.config_data;
                  // Merge strategy: Cloud overwrite local, but keep supabase creds from local
                  onUpdate({
                      ...cloudConfig,
                      supabaseConfig: { ...config.supabaseConfig, url: supabaseUrl, key: supabaseKey, lastSync: new Date().toLocaleString() }
                  });
                  setSyncMessage('Config loaded from cloud!');
                  setSyncStatus('success');
              } else {
                  setSyncMessage('No config found.');
                  setSyncStatus('error');
              }
          }

      } catch (e: any) {
          console.error(e);
          const msg = e.message || 'Operation failed';
          
          // Smart Error Handling
          if (msg.includes('user_configs') && (msg.includes('not find') || msg.includes('does not exist') || e.code === '42P01')) {
              setSyncMessage('Table missing! Please run the setup SQL below.');
              setShowSetup(true); // AUTO OPEN SETUP
          } else {
              setSyncMessage(msg);
          }
          setSyncStatus('error');
      } finally {
          setSyncLoading(false);
      }
  };

  const currentBgPreset = BACKGROUND_CATEGORIES.find(c => c.value === config.theme.backgroundImage)?.value || 'custom';
  const toHexInput = (color: string) => color.length > 7 ? color.substring(0, 7) : color;
  const projectRef = getSupabaseProjectRef(supabaseUrl);
  const sqlEditorUrl = projectRef 
        ? `https://supabase.com/dashboard/project/${projectRef}/sql/new` 
        : 'https://supabase.com/dashboard/projects';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="bg-white/95 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden border border-white/20">
        
        {/* Sidebar */}
        <div className="w-64 bg-neutral-50/80 p-6 hidden md:flex flex-col shrink-0 border-r border-neutral-100 backdrop-blur-xl">
            <h2 className="text-xl font-bold px-2 mb-8 tracking-tight text-neutral-900 flex items-center gap-2">
                <Layout size={20} />
                Config
            </h2>
            <nav className="flex-1 space-y-1">
                <NavItem id="general" label="General" icon={Monitor} activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavItem id="background" label="Background" icon={ImageIcon} activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavItem id="presets" label="Presets" icon={Sparkles} activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavItem id="appearance" label="Appearance" icon={Palette} activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavItem id="widgets" label="Widgets" icon={Layout} activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavItem id="bookmarks" label="Bookmarks" icon={BookmarkIcon} activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavItem id="private" label="Private" icon={Lock} activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavItem id="cloud" label="Cloud Sync" icon={Cloud} activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavItem id="data" label="Data & Backup" icon={Database} activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="pt-4 mt-2 border-t border-neutral-200/50">
                    <NavItem id="help" label="Wiki / Help" icon={BookOpen} activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </nav>
            <div className="px-4 py-4 text-xs font-mono text-neutral-400 text-center">
                <div className="mb-1">LO-FI v1.7.0</div>
                <div>
                    Develop By: <a href="https://davi.design" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-neutral-900 transition-colors">Davi.design</a>
                </div>
            </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden absolute top-0 left-0 w-full bg-white/90 backdrop-blur-md border-b p-4 flex justify-between items-center z-20">
             <span className="font-bold text-lg text-neutral-900">Settings</span>
             <button onClick={onClose} className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 text-neutral-800">
                <X size={20} />
             </button>
        </div>
        
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b z-10 overflow-x-auto whitespace-nowrap p-2 hide-scrollbar">
            {['general', 'background', 'presets', 'widgets', 'bookmarks', 'private', 'cloud', 'data', 'help'].map((t) => (
                <button 
                    key={t} 
                    onClick={() => setActiveTab(t as TabType)}
                    className={`inline-block px-4 py-2 text-sm font-bold capitalize rounded-full mr-2 ${activeTab === t ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}
                >
                    {t}
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col h-full relative min-w-0 bg-white">
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-full transition-all hidden md:block z-20"
            >
                <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-12 pt-28 md:pt-12 scroll-smooth w-full">
                
                {activeTab === 'general' && (
                    <div className="space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                        <SectionTitle title="General" desc="Personalize your core experience." />
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-neutral-800 ml-1">Display Name</label>
                                <StyledInput type="text" value={config.username} onChange={(e) => onUpdate({...config, username: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Toggle label="Lock Layout" subLabel="Disable dragging" checked={config.lockLayout} onChange={(v) => onUpdate({...config, lockLayout: v})} icon={Lock} />
                                <Toggle label="Zen Mode" subLabel="Hide distractions" checked={config.zenMode} onChange={(v) => onUpdate({...config, zenMode: v})} icon={EyeOff} />
                            </div>
                            <div className="pt-6 border-t border-neutral-100">
                                <label className="text-sm font-bold text-neutral-800 ml-1 mb-3 block">Search Engine</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {SEARCH_ENGINES.map(engine => (
                                        <button key={engine.name} onClick={() => onUpdate({...config, search: { ...config.search, engine }})} className={`p-3 text-sm font-medium border rounded-xl transition-all ${config.search.engine.name === engine.name ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg scale-[1.02]' : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'}`}>{engine.name}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'background' && (
                    <div className="space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                         <SectionTitle title="Background" desc="Set the mood of your space." />
                         <div className="bg-neutral-50 p-6 rounded-3xl space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-neutral-800 ml-1">Source</label>
                                <div className="relative">
                                    <select value={currentBgPreset} onChange={(e) => handleBackgroundPresetChange(e.target.value)} className="w-full p-3 bg-white border border-neutral-200 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-neutral-200 text-sm font-medium text-neutral-700">
                                        {BACKGROUND_CATEGORIES.map(cat => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-3.5 text-neutral-500 rotate-90" size={16} />
                                </div>
                            </div>
                            {currentBgPreset === 'custom' && (
                                <div className="space-y-2 animate-fade-in">
                                    <label className="text-sm font-bold text-neutral-800 ml-1">Image URL</label>
                                    <StyledInput type="text" value={config.theme.backgroundImage} onChange={(e) => updateTheme({ backgroundImage: e.target.value })} placeholder="https://..." />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-8 pt-2">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-neutral-600 mb-2 uppercase tracking-wide"><span>Blur</span><span>{config.theme.blurLevel}px</span></div>
                                    <input type="range" min="0" max="20" value={config.theme.blurLevel} onChange={(e) => updateTheme({ blurLevel: parseInt(e.target.value) })} className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-900" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-neutral-600 mb-2 uppercase tracking-wide"><span>Overlay</span><span>{Math.round(config.theme.opacityLevel * 100)}%</span></div>
                                    <input type="range" min="0.1" max="1" step="0.05" value={config.theme.opacityLevel} onChange={(e) => updateTheme({ opacityLevel: parseFloat(e.target.value) })} className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-900" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'presets' && (
                    <div className="space-y-8 animate-fade-in-up">
                        <SectionTitle title="Themes" desc="Curated styles for instant vibes." />
                         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            <button onClick={handleRandomize} className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-neutral-200 hover:border-neutral-400 transition-all h-32 flex flex-col items-center justify-center gap-2 bg-neutral-50 hover:bg-neutral-100">
                                <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform"><Shuffle size={20} className="text-neutral-700" /></div>
                                <span className="text-sm font-bold text-neutral-700">Randomize</span>
                            </button>
                            {(Object.entries(LOFI_THEMES)).map(([name, theme]) => (
                                <button key={name} onClick={() => handleApplyPreset(name as keyof typeof LOFI_THEMES)} className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all h-32 text-left p-5 flex flex-col justify-between w-full hover:-translate-y-1" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
                                    <div className="flex justify-between items-start w-full"><div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}><div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accentColor }}></div></div></div>
                                    <span className="text-lg font-bold capitalize" style={{ fontFamily: theme.font === 'mono' ? '"JetBrains Mono", monospace' : theme.font === 'serif' ? '"Playfair Display", serif' : '"Inter", sans-serif' }}>{name.replace('_', ' ')}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'widgets' && (
                    <div className="space-y-6 animate-fade-in-up h-full flex flex-col max-w-4xl mx-auto">
                        <SectionTitle title="Widgets" desc="Manage your dashboard modules." />
                        <div className="flex flex-wrap gap-2 pb-6 border-b border-neutral-100">
                            {WIDGET_LIST.map((w) => {
                                const isActive = activeWidgetTab === w.id;
                                return (
                                    <button key={w.id} onClick={() => setActiveWidgetTab(w.id as any)} className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wide transition-all ${isActive ? 'bg-neutral-900 text-white border-neutral-900 shadow-md' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:text-neutral-900'}`}>
                                        <w.icon size={14} />{w.label}<div className={`w-2 h-2 rounded-full ${w.enabled ? 'bg-green-500' : 'bg-neutral-200'} ml-1`} />
                                    </button>
                                )
                            })}
                        </div>
                        <div className="flex-1 w-full pt-2">
                             {activeWidgetTab === 'clock' && (
                                <div className="space-y-6 animate-fade-in">
                                    <Toggle label="Enable Clock" checked={config.clock.enabled} onChange={(v) => toggleWidgetEnabled('clock', v)} />
                                    {config.clock.enabled && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Toggle label="24-Hour Format" checked={config.clock.use24Hour} onChange={(v) => onUpdate({...config, clock: { ...config.clock, use24Hour: v }})} />
                                                <Toggle label="Show Greeting" checked={config.clock.showGreeting} onChange={(v) => onUpdate({...config, clock: { ...config.clock, showGreeting: v }})} />
                                            </div>
                                            <WidgetStyler label="Clock" config={config.clock} onChange={(u) => onUpdate({...config, clock: { ...config.clock, ...u }})} onReset={() => onUpdate({...config, clock: { ...config.clock, ...getStyleDefaults(DEFAULT_CONFIG.clock) }})} />
                                        </>
                                    )}
                                </div>
                            )}
                             {activeWidgetTab === 'crypto' && (
                                <div className="space-y-6 animate-fade-in">
                                    <Toggle label="Enable Crypto" checked={config.crypto.enabled} onChange={(v) => toggleWidgetEnabled('crypto', v)} />
                                    {config.crypto.enabled && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-neutral-800 ml-1">Coins (CoinGecko IDs)</label>
                                                <StyledInput type="text" value={config.crypto.coins} onChange={(e) => onUpdate({...config, crypto: { ...config.crypto, coins: e.target.value }})} placeholder="bitcoin,ethereum,solana"/>
                                            </div>
                                            <WidgetStyler label="Ticker" config={config.crypto} onChange={(u) => onUpdate({...config, crypto: { ...config.crypto, ...u }})} onReset={() => onUpdate({...config, crypto: { ...config.crypto, ...getStyleDefaults(DEFAULT_CONFIG.crypto) }})} />
                                        </>
                                    )}
                                </div>
                            )}
                            {activeWidgetTab === 'breathing' && (
                                <div className="space-y-6 animate-fade-in">
                                    <Toggle label="Enable Breathing" checked={config.breathing.enabled} onChange={(v) => toggleWidgetEnabled('breathing', v)} />
                                    {config.breathing.enabled && (
                                        <WidgetStyler label="Box Breathing" config={config.breathing} onChange={(u) => onUpdate({...config, breathing: { ...config.breathing, ...u }})} onReset={() => onUpdate({...config, breathing: { ...config.breathing, ...getStyleDefaults(DEFAULT_CONFIG.breathing) }})} />
                                    )}
                                </div>
                            )}
                            {activeWidgetTab === 'search' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100">Search engine can be changed in the 'General' tab.</div>
                                    <WidgetStyler label="Search Bar" config={config.search} onChange={(u) => onUpdate({...config, search: { ...config.search, ...u }})} onReset={() => onUpdate({...config, search: { ...config.search, ...getStyleDefaults(DEFAULT_CONFIG.search) }})} />
                                </div>
                            )}
                            {activeWidgetTab === 'todo' && (
                                <div className="space-y-6 animate-fade-in">
                                    <Toggle label="Enable Todo" checked={config.todo.enabled} onChange={(v) => toggleWidgetEnabled('todo', v)} />
                                    {config.todo.enabled && (
                                         <WidgetStyler label="Todo List" config={config.todo} onChange={(u) => onUpdate({...config, todo: { ...config.todo, ...u }})} onReset={() => onUpdate({...config, todo: { ...config.todo, ...getStyleDefaults(DEFAULT_CONFIG.todo) }})} />
                                    )}
                                </div>
                            )}
                            {activeWidgetTab === 'pomodoro' && (
                                <div className="space-y-6 animate-fade-in">
                                    <Toggle label="Enable Pomodoro" checked={config.pomodoro.enabled} onChange={(v) => toggleWidgetEnabled('pomodoro', v)} />
                                    {config.pomodoro.enabled && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-neutral-500 uppercase">Work (min)</label>
                                                    <StyledInput type="number" value={config.pomodoro.workDuration} onChange={(e) => onUpdate({...config, pomodoro: { ...config.pomodoro, workDuration: parseInt(e.target.value) || 25 }})} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-neutral-500 uppercase">Break (min)</label>
                                                    <StyledInput type="number" value={config.pomodoro.breakDuration} onChange={(e) => onUpdate({...config, pomodoro: { ...config.pomodoro, breakDuration: parseInt(e.target.value) || 5 }})} />
                                                </div>
                                            </div>
                                            <WidgetStyler label="Pomodoro" config={config.pomodoro} onChange={(u) => onUpdate({...config, pomodoro: { ...config.pomodoro, ...u }})} onReset={() => onUpdate({...config, pomodoro: { ...config.pomodoro, ...getStyleDefaults(DEFAULT_CONFIG.pomodoro) }})} />
                                        </>
                                    )}
                                </div>
                            )}
                            {activeWidgetTab === 'notes' && (
                                <div className="space-y-6 animate-fade-in">
                                    <Toggle label="Enable Notes" checked={config.notes.enabled} onChange={(v) => toggleWidgetEnabled('notes', v)} />
                                    {config.notes.enabled && (
                                        <WidgetStyler label="Scratchpad" config={config.notes} onChange={(u) => onUpdate({...config, notes: { ...config.notes, ...u }})} onReset={() => onUpdate({...config, notes: { ...config.notes, ...getStyleDefaults(DEFAULT_CONFIG.notes) }})} />
                                    )}
                                </div>
                            )}
                             {activeWidgetTab === 'quote' && (
                                <div className="space-y-6 animate-fade-in">
                                    <Toggle label="Enable Quote" checked={config.quote.enabled} onChange={(v) => toggleWidgetEnabled('quote', v)} />
                                    {config.quote.enabled && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="relative">
                                                     <label className="text-xs font-bold text-neutral-500 uppercase block mb-1">Font</label>
                                                     <select value={config.quote.font} onChange={(e) => onUpdate({...config, quote: { ...config.quote, font: e.target.value as FontType }})} className="w-full p-3 bg-neutral-100 rounded-xl appearance-none outline-none font-medium text-sm text-neutral-800">
                                                        <option value="sans">Sans Serif</option>
                                                        <option value="serif">Serif</option>
                                                        <option value="mono">Monospace</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-end">
                                                    <Toggle label="Italic" checked={config.quote.italic} onChange={(v) => onUpdate({...config, quote: { ...config.quote, italic: v }})} />
                                                </div>
                                            </div>
                                            <WidgetStyler label="Quote" config={config.quote} onChange={(u) => onUpdate({...config, quote: { ...config.quote, ...u }})} onReset={() => onUpdate({...config, quote: { ...config.quote, ...getStyleDefaults(DEFAULT_CONFIG.quote) }})} />
                                        </>
                                    )}
                                </div>
                            )}
                            {activeWidgetTab === 'weather' && (
                                <div className="space-y-6 animate-fade-in">
                                    <Toggle label="Enable Weather" checked={config.weather.enabled} onChange={(v) => toggleWidgetEnabled('weather', v)} />
                                    {config.weather.enabled && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="relative space-y-2">
                                                    <label className="text-sm font-bold text-neutral-800 ml-1">Search City</label>
                                                    <div className="relative">
                                                        <StyledInput type="text" value={cityQuery} onChange={(e) => handleCitySearch(e.target.value)} placeholder="Type city name..." />
                                                        <div className="absolute right-3 top-3.5 text-neutral-400">
                                                            {searchingCity ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
                                                        </div>
                                                    </div>
                                                    {cityResults.length > 0 && (
                                                        <div className="absolute z-50 w-full bg-white border border-neutral-200 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                                                            {cityResults.map((result: any) => (
                                                                <button key={result.id} onClick={() => selectCity(result)} className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0 flex flex-col transition-colors">
                                                                    <span className="font-bold text-neutral-800">{result.name}</span>
                                                                    <span className="text-xs text-neutral-500">{[result.admin1, result.country].filter(Boolean).join(', ')}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-neutral-800 ml-1">Current</label>
                                                    <div className="w-full p-3 bg-neutral-100 rounded-xl text-sm text-neutral-700 flex items-center gap-2 border border-transparent">
                                                        <MapPin size={16} />
                                                        <span className="truncate font-medium">{config.weather.city || 'No city selected'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex bg-neutral-100 p-1 rounded-xl">
                                                <button onClick={() => onUpdate({...config, weather: { ...config.weather, unit: 'celsius' }})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${config.weather.unit === 'celsius' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}>Celsius (°C)</button>
                                                <button onClick={() => onUpdate({...config, weather: { ...config.weather, unit: 'fahrenheit' }})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${config.weather.unit === 'fahrenheit' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}>Fahrenheit (°F)</button>
                                            </div>
                                            <WidgetStyler label="Weather" config={config.weather} onChange={(u) => onUpdate({...config, weather: { ...config.weather, ...u }})} onReset={() => onUpdate({...config, weather: { ...config.weather, ...getStyleDefaults(DEFAULT_CONFIG.weather) }})} />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                 {activeTab === 'appearance' && (
                    <div className="space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                        <SectionTitle title="Appearance" desc="Fine-tune the look and feel." />
                         <WidgetStyler label="Bookmarks Card" config={config.bookmarkStyle} onChange={(u) => onUpdate({...config, bookmarkStyle: { ...config.bookmarkStyle, ...u }})} onReset={() => onUpdate({...config, bookmarkStyle: { ...config.bookmarkStyle, ...getStyleDefaults(DEFAULT_CONFIG.bookmarkStyle) }})} />
                        <div className="bg-neutral-50 p-6 rounded-3xl space-y-6">
                             <div>
                                 <label className="text-sm font-bold text-neutral-800 block mb-3">Global Bookmark Size</label>
                                 <div className="flex bg-white p-1 rounded-xl shadow-sm">
                                     {['icon', 'small', 'medium', 'large'].map((size) => (
                                         <button key={size} onClick={() => onUpdate({...config, globalBookmarkSize: size as BookmarkSize})} className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${config.globalBookmarkSize === size ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-900'}`}>{size}</button>
                                     ))}
                                 </div>
                             </div>
                             {existingCategories.length > 0 && (
                                 <div>
                                     <label className="text-sm font-bold text-neutral-800 block mb-3">Category Overrides</label>
                                     <div className="bg-white rounded-xl border border-neutral-100 divide-y divide-neutral-50 overflow-hidden">
                                         {existingCategories.map(cat => (
                                             <div key={cat} className="flex items-center justify-between p-3 text-sm">
                                                 <span className="font-medium text-neutral-700 pl-2">{cat}</span>
                                                 <select value={config.categoryBookmarkSizes[cat] || ''} onChange={(e) => { if(e.target.value === '') { const newSizes = {...config.categoryBookmarkSizes}; delete newSizes[cat]; onUpdate({...config, categoryBookmarkSizes: newSizes}); } else { updateCategorySize(cat, e.target.value as BookmarkSize); } }} className="p-1.5 bg-neutral-50 rounded-lg text-xs font-medium outline-none border-transparent focus:bg-neutral-100 text-neutral-700">
                                                     <option value="">Default</option>
                                                     <option value="icon">Icon</option>
                                                     <option value="small">Small</option>
                                                     <option value="medium">Medium</option>
                                                     <option value="large">Large</option>
                                                 </select>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                         </div>
                        {/* Appearance settings (colors, fonts) kept */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <label className="flex flex-col gap-2 p-3 bg-neutral-50 rounded-2xl cursor-pointer hover:bg-neutral-100 transition-colors group">
                                    <span className="text-xs font-bold text-neutral-600 uppercase">Background</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: config.theme.backgroundColor }}></div>
                                        <span className="text-xs font-mono text-neutral-500">{config.theme.backgroundColor}</span>
                                    </div>
                                    <input type="color" value={toHexInput(config.theme.backgroundColor)} onChange={(e) => updateTheme({ backgroundColor: e.target.value })} className="hidden" />
                                </label>
                                <label className="flex flex-col gap-2 p-3 bg-neutral-50 rounded-2xl cursor-pointer hover:bg-neutral-100 transition-colors group">
                                    <span className="text-xs font-bold text-neutral-600 uppercase">Text</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: config.theme.textColor }}></div>
                                        <span className="text-xs font-mono text-neutral-500">{config.theme.textColor}</span>
                                    </div>
                                    <input type="color" value={config.theme.textColor} onChange={(e) => updateTheme({ textColor: e.target.value })} className="hidden" />
                                </label>
                                <label className="flex flex-col gap-2 p-3 bg-neutral-50 rounded-2xl cursor-pointer hover:bg-neutral-100 transition-colors group">
                                    <span className="text-xs font-bold text-neutral-600 uppercase">Accent</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: config.theme.accentColor }}></div>
                                        <span className="text-xs font-mono text-neutral-500">{config.theme.accentColor}</span>
                                    </div>
                                    <input type="color" value={config.theme.accentColor} onChange={(e) => updateTheme({ accentColor: e.target.value })} className="hidden" />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-bold text-neutral-800 block mb-3">Radius</label>
                                    <div className="flex bg-neutral-100 p-1 rounded-xl">
                                        {['0px', '4px', '8px', '16px', '99px'].map(r => (
                                            <button key={r} onClick={() => updateTheme({ borderRadius: r })} className={`flex-1 h-8 text-[10px] font-mono rounded-lg transition-all ${config.theme.borderRadius === r ? 'bg-white shadow-sm text-neutral-900 font-bold border border-black/5' : 'text-neutral-500 hover:text-neutral-700'}`}>{r.replace('px', '')}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-neutral-800 block mb-3">Typography</label>
                                    <select value={config.theme.font} onChange={(e) => updateTheme({ font: e.target.value as FontType })} className="w-full p-2.5 bg-neutral-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-neutral-200 transition-all text-neutral-800">
                                        <option value="sans">Inter (Modern)</option>
                                        <option value="serif">Playfair (Elegant)</option>
                                        <option value="mono">Mono (Code)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'bookmarks' && (
                    <div className="space-y-8 animate-fade-in-up max-w-3xl mx-auto">
                        <SectionTitle title="Bookmarks" desc="Manage your links and categories." />
                        
                        {/* Add New Form */}
                        <div className="bg-neutral-50 p-6 rounded-3xl space-y-4">
                             <h4 className="font-bold text-neutral-900 flex items-center gap-2"><Plus size={18}/> Add New</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <StyledInput placeholder="Title (e.g., GitHub)" value={newBookmarkTitle} onChange={e => setNewBookmarkTitle(e.target.value)} />
                                 <StyledInput placeholder="URL (https://...)" value={newBookmarkUrl} onChange={e => setNewBookmarkUrl(e.target.value)} />
                             </div>
                             
                             {/* Improved Category Selection */}
                             <div className="space-y-2">
                                <label className="text-sm font-bold text-neutral-800 ml-1 block">Category</label>
                                
                                {existingCategories.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {existingCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setNewBookmarkCategory(cat)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                    newBookmarkCategory === cat
                                                    ? 'bg-neutral-900 text-white border-neutral-900'
                                                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                    <StyledInput 
                                        placeholder="Or type new category..." 
                                        value={newBookmarkCategory} 
                                        onChange={e => setNewBookmarkCategory(e.target.value)} 
                                    />
                                    <Toggle label="Favorite" checked={newBookmarkIsFavorite} onChange={setNewBookmarkIsFavorite} />
                                </div>
                             </div>

                             <button onClick={addBookmark} disabled={!newBookmarkTitle || !newBookmarkUrl} className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition disabled:opacity-50 mt-2">Add Bookmark</button>
                        </div>

                        {/* List */}
                        <div className="space-y-2">
                            {config.bookmarks.filter(b => b.category !== 'Private').map(b => (
                                <div key={b.id} className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-2xl group hover:border-neutral-300 transition-all">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 font-bold text-neutral-600">
                                            {b.title.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-neutral-900 truncate">{b.title}</div>
                                            <div className="text-xs text-neutral-500 truncate">{b.url}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="px-2 py-1 bg-neutral-100 rounded-lg text-[10px] font-bold uppercase tracking-wider text-neutral-600">{b.category || 'General'}</span>
                                        <button onClick={() => toggleFavorite(b.id)} className={`p-2 rounded-xl transition-colors ${b.isFavorite ? 'text-yellow-400 bg-yellow-50' : 'text-neutral-300 hover:text-yellow-400'}`}>
                                            <Star size={18} fill={b.isFavorite ? "currentColor" : "none"} />
                                        </button>
                                        <button onClick={() => removeBookmark(b.id)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                             {config.bookmarks.filter(b => b.category !== 'Private').length === 0 && (
                                <div className="text-center py-8 text-neutral-400">No bookmarks yet.</div>
                             )}
                        </div>
                    </div>
                )}

                {activeTab === 'private' && (
                    <div className="space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                        <SectionTitle title="Private Vault" desc="Secure bookmarks hidden from the main view." />
                        
                        {!config.privateConfig.enabled ? (
                            <div className="bg-neutral-50 p-8 rounded-3xl text-center space-y-4">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-neutral-900 mb-2">
                                    <Shield size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900">Enable Private Vault</h3>
                                <p className="text-neutral-600 max-w-md mx-auto">Create a password to access a hidden category of bookmarks. These links won't appear in search or the main grid until unlocked.</p>
                                <div className="max-w-xs mx-auto space-y-2">
                                    <StyledInput type="password" placeholder="Set Password" value={privatePasswordInput} onChange={e => setPrivatePasswordInput(e.target.value)} />
                                    {privateError && <p className="text-red-500 text-xs font-bold">{privateError}</p>}
                                </div>
                                <button onClick={handleUnlockPrivate} className="px-8 py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition">Enable Vault</button>
                            </div>
                        ) : !isPrivateUnlocked ? (
                             <div className="bg-neutral-50 p-8 rounded-3xl text-center space-y-4">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-neutral-900 mb-2">
                                    <Lock size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900">Vault Locked</h3>
                                <div className="max-w-xs mx-auto space-y-2">
                                    <StyledInput type="password" placeholder="Enter Password" value={privatePasswordInput} onChange={e => setPrivatePasswordInput(e.target.value)} />
                                    {privateError && <p className="text-red-500 text-xs font-bold">{privateError}</p>}
                                </div>
                                <button onClick={handleUnlockPrivate} className="px-8 py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition">Unlock</button>
                            </div>
                        ) : (
                             <div className="space-y-6">
                                <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
                                    <Unlock size={18} /> Vault Unlocked
                                </div>

                                <div className="bg-neutral-50 p-6 rounded-3xl space-y-4">
                                     <h4 className="font-bold text-neutral-900 flex items-center gap-2"><Plus size={18}/> Add Private Link</h4>
                                     <div className="grid grid-cols-1 gap-4">
                                         <StyledInput placeholder="Title" value={newPrivateLinkTitle} onChange={e => setNewPrivateLinkTitle(e.target.value)} />
                                         <StyledInput placeholder="URL" value={newPrivateLinkUrl} onChange={e => setNewPrivateLinkUrl(e.target.value)} />
                                     </div>
                                     <button onClick={addPrivateBookmark} disabled={!newPrivateLinkTitle || !newPrivateLinkUrl} className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition disabled:opacity-50">Add to Vault</button>
                                </div>

                                <div className="space-y-2">
                                    {privateBookmarks.map(b => (
                                        <div key={b.id} className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-2xl group hover:border-neutral-300 transition-all">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 font-bold">
                                                    <Lock size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-neutral-900 truncate">{b.title}</div>
                                                    <div className="text-xs text-neutral-500 truncate">{b.url}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => removeBookmark(b.id)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    {privateBookmarks.length === 0 && (
                                        <div className="text-center py-8 text-neutral-400">Vault is empty.</div>
                                    )}
                                </div>
                             </div>
                        )}
                    </div>
                )}

                {activeTab === 'cloud' && (
                    <div className="space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                        <SectionTitle title="Cloud Sync" desc="Sync your config using Supabase." />
                        
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-900 text-sm">
                            <Cloud className="shrink-0 mt-0.5" size={18} />
                            <div>
                                <p className="font-bold mb-1">Self-Hosted Sync</p>
                                <p className="opacity-80 leading-relaxed">
                                    Connect to your own project at <a href="https://supabase.com" target="_blank" className="underline font-bold">supabase.com</a>. 
                                    Copy your Project URL and Anon Key below.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-neutral-800 ml-1 mb-1 block">Project URL</label>
                                <StyledInput 
                                    value={supabaseUrl} 
                                    onChange={(e) => setSupabaseUrl(e.target.value)} 
                                    placeholder="https://xyz.supabase.co"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-neutral-800 ml-1 mb-1 block">Anon Public Key</label>
                                <StyledInput 
                                    value={supabaseKey} 
                                    onChange={(e) => setSupabaseKey(e.target.value)} 
                                    placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                                    type="password"
                                />
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mt-2">
                                    <Lock size={16} className="text-neutral-400" />
                                    <span className="font-bold text-neutral-900 text-sm">Secure Access (Optional)</span>
                                </div>
                                
                                <StyledInput 
                                    type="password" 
                                    value={syncPassword} 
                                    onChange={(e) => setSyncPassword(e.target.value)} 
                                    placeholder="Backup Password (creates a secure user)"
                                />
                                <p className="text-xs text-neutral-400 px-1">
                                    Leave empty for public/anonymous tables. Enter a password to automatically create/login a secure user ('owner') for your data.
                                </p>
                            </div>

                             {/* Local Credential Manager */}
                             <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex items-center justify-between gap-4 mt-2">
                                <div>
                                    <h5 className="text-xs font-bold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5"><HardDrive size={12}/> Browser Credential Manager</h5>
                                    <p className="text-[10px] text-neutral-500 mt-1">Save URL, Key & Password to this browser so you don't lose access if you reset the app.</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button 
                                        onClick={saveLocalCredentials}
                                        className="p-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 text-neutral-700 transition-colors shadow-sm"
                                        title="Save Credentials to Browser"
                                    >
                                        <Save size={16} />
                                    </button>
                                     <button 
                                        onClick={loadLocalCredentials}
                                        className="p-2 bg-neutral-900 border border-neutral-900 rounded-lg hover:bg-neutral-800 text-white transition-colors shadow-sm"
                                        title="Auto-fill Saved Credentials"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                             </div>

                        </div>

                         <div className="pt-2">
                            <button 
                                onClick={() => setShowSetup(!showSetup)}
                                className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors mb-2"
                            >
                                <Terminal size={12} />
                                {showSetup ? 'Hide Database Setup' : 'Show Database Setup (SQL)'}
                            </button>
                            
                            {showSetup && (
                                <div className="bg-neutral-900 rounded-xl p-4 relative group animate-fade-in mt-2">
                                    <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                                         <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">SQL Setup Script</span>
                                         <div className="flex gap-2">
                                             <a 
                                                href={sqlEditorUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/20 transition-colors"
                                             >
                                                <ExternalLink size={10} /> Open SQL Editor
                                             </a>
                                             <button 
                                                onClick={copySql}
                                                className="flex items-center gap-1 text-[10px] bg-white/10 text-white/70 px-2 py-1 rounded hover:bg-white/20 transition-colors"
                                                title="Copy SQL"
                                             >
                                                <Copy size={10} /> Copy
                                             </button>
                                         </div>
                                    </div>
                                    <div className="text-[10px] text-yellow-500/80 font-medium mb-2">
                                        ⚠️ Paste this in the SQL Editor. Do NOT import as CSV/Data.
                                    </div>
                                    <pre className="text-[10px] font-mono text-neutral-400 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                                        {SETUP_SQL}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <hr className="border-neutral-100" />

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <button 
                                onClick={() => handleSync('push')}
                                disabled={syncLoading || !supabaseUrl || !supabaseKey}
                                className="flex flex-col items-center justify-center p-6 bg-neutral-900 text-white rounded-2xl hover:bg-neutral-800 transition gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-neutral-200"
                            >
                                {syncLoading ? <Loader size={24} className="animate-spin" /> : <Upload size={24} />}
                                <span className="font-bold">Save to Cloud</span>
                                <span className="text-xs opacity-70">Overwrite cloud config</span>
                            </button>
                            <button 
                                onClick={() => handleSync('pull')}
                                disabled={syncLoading || !supabaseUrl || !supabaseKey}
                                className="flex flex-col items-center justify-center p-6 bg-white border border-neutral-200 text-neutral-900 rounded-2xl hover:bg-neutral-50 transition gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {syncLoading ? <Loader size={24} className="animate-spin" /> : <Download size={24} />}
                                <span className="font-bold">Load from Cloud</span>
                                <span className="text-xs text-neutral-500">Overwrite local config</span>
                            </button>
                        </div>

                        {config.supabaseConfig.lastSync && (
                            <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 mt-2">
                                <RefreshCw size={12} />
                                <span>Last Sync: {config.supabaseConfig.lastSync}</span>
                            </div>
                        )}

                        {syncMessage && (
                            <div className={`p-4 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2 ${syncStatus === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {syncStatus === 'error' && <AlertCircle size={16} />}
                                {syncStatus === 'success' && <Check size={16} />}
                                {syncMessage}
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'data' && (
                     <div className="space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                        <SectionTitle title="Data & Storage" desc="Manage your configuration files." />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={handleExport} className="group flex flex-col items-center justify-center p-8 bg-neutral-50 rounded-3xl hover:bg-neutral-100 transition-all border border-transparent hover:border-neutral-200">
                                <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform"><Download size={24} className="text-neutral-700" /></div>
                                <span className="font-bold text-lg text-neutral-800">Export Config</span>
                                <span className="text-xs text-neutral-500 mt-1">Save backup JSON</span>
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="group flex flex-col items-center justify-center p-8 bg-neutral-50 rounded-3xl hover:bg-neutral-100 transition-all border border-transparent hover:border-neutral-200">
                                <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform"><Upload size={24} className="text-neutral-700" /></div>
                                <span className="font-bold text-lg text-neutral-800">Import Config</span>
                                <span className="text-xs text-neutral-500 mt-1">Restore from JSON</span>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                            </button>
                        </div>
                        <div className="mt-8 p-6 rounded-3xl border border-red-100 bg-red-50/50">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-100 text-red-600 rounded-xl"><Trash2 size={20} /></div>
                                <div>
                                    <h4 className="font-bold text-red-900 mb-1">Danger Zone</h4>
                                    <p className="text-sm text-red-700/80 mb-4">Resetting will delete all local data, bookmarks, and settings permanently.</p>
                                    <button onClick={resetToDefault} className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition font-bold text-sm shadow-sm">Reset Application</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'help' && (
                    <div className="space-y-8 animate-fade-in-up max-w-3xl mx-auto">
                        <SectionTitle title="Wiki & Guide" desc="How to use your Lo-Fi space." />
                        
                        {/* Quick Start Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-neutral-50 rounded-3xl space-y-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-neutral-700"><MousePointer2 size={20} /></div>
                                <h4 className="font-bold text-neutral-900">Drag & Drop</h4>
                                <p className="text-sm text-neutral-600 leading-relaxed">
                                    Hover over any widget to reveal the drag handle (dots). Click and hold to move widgets between the sidebar, header, and top corners.
                                </p>
                            </div>
                            <div className="p-6 bg-neutral-50 rounded-3xl space-y-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-neutral-700"><EyeOff size={20} /></div>
                                <h4 className="font-bold text-neutral-900">Zen Mode</h4>
                                <p className="text-sm text-neutral-600 leading-relaxed">
                                    Press <kbd className="bg-white px-2 py-0.5 rounded border border-neutral-200 font-mono text-xs font-bold text-neutral-800">Z</kbd> on your keyboard to instantly hide everything except the clock and search bar for focus.
                                </p>
                            </div>
                            <div className="p-6 bg-neutral-50 rounded-3xl space-y-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-neutral-700"><Shield size={20} /></div>
                                <h4 className="font-bold text-neutral-900">Private Vault</h4>
                                <p className="text-sm text-neutral-600 leading-relaxed">
                                    Create a bookmarks category named <strong>"Private"</strong>. Go to the Private tab to set a password. Click the Lock/Eye icon on the dashboard to access them.
                                </p>
                            </div>
                             <div className="p-6 bg-neutral-50 rounded-3xl space-y-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-neutral-700"><Cloud size={20} /></div>
                                <h4 className="font-bold text-neutral-900">Cloud Sync</h4>
                                <p className="text-sm text-neutral-600 leading-relaxed">
                                    Connect your own Supabase project in the Cloud tab. Enter a password to automatically create a secure user for your config backup.
                                </p>
                            </div>
                        </div>

                        {/* Widget Glossary */}
                        <div>
                            <h4 className="text-lg font-bold text-neutral-900 mb-4 px-1">Widget Glossary</h4>
                            <div className="bg-white border border-neutral-100 rounded-3xl overflow-hidden divide-y divide-neutral-100">
                                <div className="p-4 flex gap-4 hover:bg-neutral-50 transition-colors">
                                    <Clock size={20} className="text-neutral-400 shrink-0 mt-1" />
                                    <div>
                                        <h5 className="font-bold text-sm text-neutral-800">Clock</h5>
                                        <p className="text-xs text-neutral-500 mt-1">Displays current time and a personal greeting based on time of day.</p>
                                    </div>
                                </div>
                                <div className="p-4 flex gap-4 hover:bg-neutral-50 transition-colors">
                                    <Timer size={20} className="text-neutral-400 shrink-0 mt-1" />
                                    <div>
                                        <h5 className="font-bold text-sm text-neutral-800">Pomodoro</h5>
                                        <p className="text-xs text-neutral-500 mt-1">Focus timer with adjustable Work and Break intervals.</p>
                                    </div>
                                </div>
                                <div className="p-4 flex gap-4 hover:bg-neutral-50 transition-colors">
                                    <ListChecks size={20} className="text-neutral-400 shrink-0 mt-1" />
                                    <div>
                                        <h5 className="font-bold text-sm text-neutral-800">Todo List</h5>
                                        <p className="text-xs text-neutral-500 mt-1">Simple task manager. Tasks are saved locally.</p>
                                    </div>
                                </div>
                                <div className="p-4 flex gap-4 hover:bg-neutral-50 transition-colors">
                                    <Cloud size={20} className="text-neutral-400 shrink-0 mt-1" />
                                    <div>
                                        <h5 className="font-bold text-sm text-neutral-800">Weather</h5>
                                        <p className="text-xs text-neutral-500 mt-1">Current conditions for your city. Caches data to save battery.</p>
                                    </div>
                                </div>
                                <div className="p-4 flex gap-4 hover:bg-neutral-50 transition-colors">
                                    <Bitcoin size={20} className="text-neutral-400 shrink-0 mt-1" />
                                    <div>
                                        <h5 className="font-bold text-sm text-neutral-800">Crypto Ticker</h5>
                                        <p className="text-xs text-neutral-500 mt-1">Live prices for coins (e.g., bitcoin, ethereum). Add IDs from CoinGecko.</p>
                                    </div>
                                </div>
                                <div className="p-4 flex gap-4 hover:bg-neutral-50 transition-colors">
                                    <Wind size={20} className="text-neutral-400 shrink-0 mt-1" />
                                    <div>
                                        <h5 className="font-bold text-sm text-neutral-800">Breathing</h5>
                                        <p className="text-xs text-neutral-500 mt-1">Box breathing exercise visualizer (4s inhale, 4s hold, 4s exhale, 4s hold).</p>
                                    </div>
                                </div>
                                <div className="p-4 flex gap-4 hover:bg-neutral-50 transition-colors">
                                    <StickyNote size={20} className="text-neutral-400 shrink-0 mt-1" />
                                    <div>
                                        <h5 className="font-bold text-sm text-neutral-800">Notes</h5>
                                        <p className="text-xs text-neutral-500 mt-1">Quick scratchpad for thoughts. Persists on reload.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
