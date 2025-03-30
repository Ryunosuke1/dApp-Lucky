import React from 'react';
import { useApiSettings } from '@/hooks/use-api-settings';

interface UseApiSettingsResult {
  settings: {
    openai: {
      apiKey: string;
      baseUrl: string;
      model: string;
    };
    dappradar: {
      apiKey: string;
    };
  };
  updateSettings: (newSettings: UseApiSettingsResult['settings']) => void;
}

// Default settings
const defaultSettings = {
  openai: {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo'
  },
  dappradar: {
    apiKey: ''
  }
};

// Local storage key
const STORAGE_KEY = 'dapp-explorer-api-settings';

export function useApiSettings(): UseApiSettingsResult {
  const [settings, setSettings] = React.useState(() => {
    // Try to load settings from localStorage
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        try {
          return JSON.parse(savedSettings);
        } catch (e) {
          console.error('Failed to parse saved API settings:', e);
        }
      }
    }
    return defaultSettings;
  });

  const updateSettings = React.useCallback((newSettings: UseApiSettingsResult['settings']) => {
    setSettings(newSettings);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    }
  }, []);

  return { settings, updateSettings };
}
