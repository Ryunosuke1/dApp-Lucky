import { useState, useEffect } from "react";
import { ApiSettings } from "@/components/api-settings-modal";

const API_SETTINGS_KEY = 'dapp-lucky-api-settings';

// Default settings
const defaultSettings: ApiSettings = {
  baseUrl: "https://api.openai.com/v1", // OpenAI default
  apiKey: "",
  modelName: "gpt-3.5-turbo",
};

export function useApiSettings() {
  const [settings, setSettings] = useState<ApiSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(API_SETTINGS_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error("Failed to load API settings from localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: ApiSettings) => {
    try {
      localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to save API settings to localStorage:", error);
    }
  };

  // Check if settings have been configured
  const isConfigured = Boolean(settings.apiKey && settings.baseUrl && settings.modelName);

  return {
    settings,
    saveSettings,
    isConfigured,
    isLoaded,
  };
}