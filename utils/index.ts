
import { FontType } from '../types';

// Color Utilities
export const hexToRgba = (hex: string, alpha: number) => {
  let r = 0, g = 0, b = 0;
  // Handle 3-digit hex
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length >= 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Security/Hashing (Client-side obfuscation)
export const simpleHash = (str: string) => {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
};

// Font Utilities
export const getFontFamily = (font: FontType) => {
  switch (font) {
    case 'mono': return '"JetBrains Mono", monospace';
    case 'serif': return '"Playfair Display", serif';
    case 'sans': default: return '"Inter", sans-serif';
  }
};

export const getQuoteFont = (font: FontType) => {
    switch (font) {
      case 'mono': return '"JetBrains Mono", monospace';
      case 'serif': return '"Playfair Display", serif';
      case 'sans': default: return '"Inter", sans-serif';
    }
};
