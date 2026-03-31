
import { useState, useEffect, useRef } from 'react';

// Hook to debounce values (delay updates until user stops typing)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook to handle LocalStorage with debounce built-in
export function usePersistedState<T>(key: string, initialState: T, delay: number = 1000) {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialState;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialState;
    }
  });

  const debouncedState = useDebounce(state, delay);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(debouncedState));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [debouncedState, key]);

  return [state, setState] as const;
}
