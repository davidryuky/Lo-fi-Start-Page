
export type FontType = 'sans' | 'mono' | 'serif';
export type BookmarkSize = 'icon' | 'small' | 'medium' | 'large';

export interface ThemeConfig {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  backgroundImage: string; // URL or empty
  blurLevel: number; // 0 to 20
  opacityLevel: number; // 0.1 to 1
  font: FontType;
  borderRadius: string; // '0px', '8px', '99px'
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  isFavorite?: boolean;
  category?: string;
}

export interface SearchEngine {
  name: string;
  url: string; 
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

// -- New Widget Styling --

export interface WidgetStyle {
  backgroundColor: string;
  textColor: string;
  blurLevel: number;
  opacityLevel: number;
}

export interface TodoConfig extends WidgetStyle {
  enabled: boolean;
}

export interface ClockConfig extends WidgetStyle {
  enabled: boolean;
  use24Hour: boolean;
  showGreeting: boolean;
}

export interface SearchBarConfig extends WidgetStyle {
  engine: SearchEngine;
}

export interface QuoteConfig extends WidgetStyle {
  enabled: boolean;
  font: FontType;
  italic: boolean;
}

export interface WeatherConfig extends WidgetStyle {
  enabled: boolean;
  city: string;
  latitude?: number; // Store precise coordinates
  longitude?: number; // Store precise coordinates
  unit: 'celsius' | 'fahrenheit';
}

export interface PomodoroConfig extends WidgetStyle {
  enabled: boolean;
  workDuration: number; // minutes
  breakDuration: number; // minutes
}

export interface NotesConfig extends WidgetStyle {
  enabled: boolean;
  content: string;
}

// -- NEW WIDGETS TYPES --

export interface CryptoConfig extends WidgetStyle {
  enabled: boolean;
  coins: string; // Comma separated IDs (e.g. "bitcoin,ethereum")
}

export interface BreathingConfig extends WidgetStyle {
  enabled: boolean;
}

export interface PrivateConfig {
  enabled: boolean;
  passwordHash: string;
}

export interface SupabaseConfig {
  url: string;
  key: string;
  autoSync: boolean;
  lastSync?: string;
}

export interface WidgetLayout {
  header: string[];
  sidebar: string[];
  topLeft: string[]; // Changed from string | null to string[]
  topRight: string[]; // Changed from string | null to string[]
}

export interface AppConfig {
  username: string;
  theme: ThemeConfig;
  bookmarks: Bookmark[];
  
  // Widgets
  clock: ClockConfig;
  search: SearchBarConfig;
  todo: TodoConfig;
  quote: QuoteConfig;
  weather: WeatherConfig;
  pomodoro: PomodoroConfig;
  notes: NotesConfig;
  
  // New Widgets
  crypto: CryptoConfig;
  breathing: BreathingConfig;

  // Private Category
  privateConfig: PrivateConfig;

  // Cloud Sync
  supabaseConfig: SupabaseConfig;

  todos: TodoItem[]; // Data

  // Bookmark Appearance
  bookmarkStyle: WidgetStyle; // New style config for bookmarks
  globalBookmarkSize: BookmarkSize;
  categoryBookmarkSizes: Record<string, BookmarkSize>;
  collapsedCategories: string[]; // List of categories that are hidden
  categoryOrder: string[]; // Order of categories

  // Widget Layout
  layout: WidgetLayout;
  lockLayout: boolean;
  
  // Focus
  zenMode: boolean; // Hide everything but clock/search
}
