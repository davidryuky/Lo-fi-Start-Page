
import { AppConfig, SearchEngine } from './types';

export const SEARCH_ENGINES: SearchEngine[] = [
  { name: 'Google', url: 'https://www.google.com/search?q=' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=' },
];

export const QUOTES = [
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Everything you can imagine is real.", author: "Pablo Picasso" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Limit your 'always' and your 'nevers'.", author: "Amy Poehler" },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
  { text: "Comparison is the thief of joy.", author: "Theodore Roosevelt" },
  { text: "Change the world by being yourself.", author: "Amy Poehler" },
  { text: "Every moment is a fresh beginning.", author: "T.S. Eliot" },
  { text: "Die with memories, not dreams.", author: "Unknown" },
  { text: "Aspire to inspire before we expire.", author: "Unknown" },
  { text: "Whatever you are, be a good one.", author: "Abraham Lincoln" },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "Get busy living or get busy dying.", author: "Stephen King" },
  { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
  { text: "The best way to predict your future is to create it.", author: "Abraham Lincoln" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Do not wait; the time will never be 'just right'.", author: "Napoleon Hill" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
];

export const BACKGROUND_CATEGORIES = [
    { label: 'Custom URL', value: 'custom' },
    { label: 'Random (Harsh Bin)', value: 'random_harsh_bin' },
    { label: 'Nature', value: 'https://loremflickr.com/1920/1080/nature' },
    { label: 'City', value: 'https://loremflickr.com/1920/1080/city' },
    { label: 'Tech', value: 'https://loremflickr.com/1920/1080/technology' },
    { label: 'Lo-Fi', value: 'https://loremflickr.com/1920/1080/lofi' },
    { label: 'Abstract', value: 'https://loremflickr.com/1920/1080/abstract' },
];

const DEFAULT_WIDGET_STYLE = {
  backgroundColor: '#1a1a1a',
  textColor: '#e5e5e5',
  blurLevel: 0,
  opacityLevel: 0, // Transparent by default for most to retain lofi look
};

export const DEFAULT_CONFIG: AppConfig = {
  username: 'Traveler',
  todos: [],
  zenMode: false,
  
  clock: {
    ...DEFAULT_WIDGET_STYLE,
    enabled: true,
    use24Hour: true,
    showGreeting: true,
  },
  
  search: {
    ...DEFAULT_WIDGET_STYLE,
    engine: SEARCH_ENGINES[0],
  },

  todo: {
    ...DEFAULT_WIDGET_STYLE,
    enabled: false,
    blurLevel: 8,
    opacityLevel: 0, // Explicitly 0
  },

  quote: {
    ...DEFAULT_WIDGET_STYLE,
    enabled: true,
    font: 'serif',
    italic: true,
  },

  weather: {
    ...DEFAULT_WIDGET_STYLE,
    backgroundColor: '#ffffff', 
    opacityLevel: 0,
    enabled: false,
    city: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    unit: 'celsius',
  },

  pomodoro: {
    ...DEFAULT_WIDGET_STYLE,
    backgroundColor: '#ffffff',
    opacityLevel: 0,
    blurLevel: 8,
    enabled: false,
    workDuration: 25,
    breakDuration: 5,
  },

  notes: {
    ...DEFAULT_WIDGET_STYLE,
    backgroundColor: '#ffffff',
    opacityLevel: 0,
    blurLevel: 0,
    enabled: false,
    content: '',
  },

  // New Widgets Default Config (Disabled by default)
  crypto: {
    ...DEFAULT_WIDGET_STYLE,
    backgroundColor: '#000000',
    opacityLevel: 0, // Transparent default
    enabled: false,
    coins: 'bitcoin,ethereum,solana,cardano,ripple'
  },

  breathing: {
    ...DEFAULT_WIDGET_STYLE,
    enabled: false,
    opacityLevel: 0,
  },

  privateConfig: {
    enabled: false,
    passwordHash: '',
  },

  supabaseConfig: {
      url: '',
      key: '',
      autoSync: false,
  },

  bookmarkStyle: {
    backgroundColor: '#1a1a1a', // Fallback
    textColor: '#e5e5e5',
    blurLevel: 0,
    opacityLevel: 0, // Transparent by default
  },

  globalBookmarkSize: 'medium',
  categoryBookmarkSizes: {},
  collapsedCategories: [],
  categoryOrder: ['AI Tools'], // AI Tools first by default
  
  layout: {
    header: [],
    // Add new widgets here so they have a place in the layout structure by default
    sidebar: ['weather', 'pomodoro', 'todo', 'notes', 'crypto', 'breathing'],
    topLeft: [],
    topRight: []
  },

  lockLayout: false,
  
  theme: {
    backgroundColor: '#1a1a1a',
    textColor: '#e5e5e5',
    accentColor: '#84cc16', // lime-500
    backgroundImage: '',
    blurLevel: 0,
    opacityLevel: 0.95,
    font: 'mono',
    borderRadius: '4px',
  },
  bookmarks: [
    { id: '1', title: 'GitHub', url: 'https://github.com', isFavorite: true, category: 'Development' },
    { id: '2', title: 'YouTube', url: 'https://youtube.com', isFavorite: false, category: 'Media' },
    { id: '3', title: 'Reddit', url: 'https://reddit.com', isFavorite: false, category: 'Social' },
    { id: '4', title: 'Gmail', url: 'https://mail.google.com', isFavorite: true, category: 'Work' },
    
    // AI Tools
    { id: 'ai-1', title: 'DeepSeek', url: 'https://chat.deepseek.com', isFavorite: false, category: 'AI Tools' },
    { id: 'ai-2', title: 'Gemini', url: 'https://gemini.google.com', isFavorite: false, category: 'AI Tools' },
    { id: 'ai-3', title: 'Claude', url: 'https://claude.ai', isFavorite: false, category: 'AI Tools' },
    { id: 'ai-4', title: 'Grok', url: 'https://x.com/i/grok', isFavorite: false, category: 'AI Tools' },
    { id: 'ai-5', title: 'Aixploria', url: 'https://www.aixploria.com', isFavorite: false, category: 'AI Tools' },
  ],
};

export const LOFI_THEMES = {
  bw: {
    backgroundColor: '#000000',
    textColor: '#ffffff',
    accentColor: '#ffffff',
    backgroundImage: '',
    font: 'mono',
    borderRadius: '0px',
  },
  one_piece: {
    backgroundColor: '#0284c7', // Ocean Blue
    textColor: '#fffbeb', // Parchment
    accentColor: '#fbbf24', // Straw Hat Gold
    backgroundImage: '',
    font: 'serif',
    borderRadius: '8px',
  },
  hell: {
    backgroundColor: '#2a0a0a', // Deep Red/Black
    textColor: '#fca5a5', // Light Red
    accentColor: '#ef4444', // Fire Red
    backgroundImage: '',
    font: 'serif',
    borderRadius: '12px',
  },
  terminal: {
    backgroundColor: '#0c0c0c',
    textColor: '#33ff33',
    accentColor: '#33ff33',
    backgroundImage: '',
    font: 'mono',
    borderRadius: '0px',
  },
  paper: {
    backgroundColor: '#f5f5dc',
    textColor: '#2d2d2d',
    accentColor: '#d97706',
    backgroundImage: '',
    font: 'serif',
    borderRadius: '2px',
  },
  night: {
    backgroundColor: '#11111b',
    textColor: '#cdd6f4',
    accentColor: '#f38ba8',
    backgroundImage: '',
    font: 'sans',
    borderRadius: '8px',
  },
  dracula: {
    backgroundColor: '#282a36',
    textColor: '#f8f8f2',
    accentColor: '#bd93f9',
    backgroundImage: '',
    font: 'mono',
    borderRadius: '4px',
  },
  nord: {
    backgroundColor: '#2e3440',
    textColor: '#d8dee9',
    accentColor: '#88c0d0',
    backgroundImage: '',
    font: 'sans',
    borderRadius: '6px',
  },
  forest: {
    backgroundColor: '#1a2f23',
    textColor: '#e2e8f0',
    accentColor: '#4ade80',
    backgroundImage: '',
    font: 'sans',
    borderRadius: '12px',
  },
  coffee: {
    backgroundColor: '#2c1e18',
    textColor: '#dcc0a8',
    accentColor: '#d4a373',
    backgroundImage: '',
    font: 'serif',
    borderRadius: '4px',
  },
  aqua: {
    backgroundColor: '#e0f2fe',
    textColor: '#0c4a6e',
    accentColor: '#0ea5e9',
    backgroundImage: '',
    font: 'sans',
    borderRadius: '16px',
  },
  journal: {
    backgroundColor: '#fffbeb',
    textColor: '#451a03',
    accentColor: '#b45309',
    backgroundImage: '',
    font: 'serif',
    borderRadius: '2px',
  },
  gamer: {
    backgroundColor: '#09090b',
    textColor: '#fafafa',
    accentColor: '#8b5cf6',
    backgroundImage: '',
    font: 'sans',
    borderRadius: '8px',
  },
  cyberpunk: {
    backgroundColor: '#050505',
    textColor: '#00f3ff',
    accentColor: '#ff0099',
    backgroundImage: '',
    font: 'mono',
    borderRadius: '0px',
  },
  light: {
    backgroundColor: '#ffffff',
    textColor: '#171717',
    accentColor: '#2563eb',
    backgroundImage: '',
    font: 'sans',
    borderRadius: '8px',
  },
};
