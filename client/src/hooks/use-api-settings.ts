import { useState, useEffect, useCallback } from "react";
import { ApiSettings } from "@/components/api-settings-modal";
import { useAccount } from "wagmi";

// Storage keys
const API_SETTINGS_KEY_PREFIX = 'dapp-lucky-api-settings';
const GLOBAL_API_SETTINGS_KEY = `${API_SETTINGS_KEY_PREFIX}-global`;

// Default settings
const defaultSettings: ApiSettings = {
  baseUrl: "https://api.openai.com/v1", // OpenAI default
  apiKey: "",
  modelName: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  customModelValue: "", // Custom model value placeholder
};

// Models available
export const availableModels = [
  { value: "gpt-4o", label: "GPT-4o (Recommended)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Faster)" },
  { value: "claude-3-opus-20240229", label: "Claude 3 Opus (Via OpenRouter)" },
  { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet (Via OpenRouter)" },
  { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B (Via OpenRouter)" },
];

// Get the wallet-specific storage key
function getWalletApiSettingsKey(address?: string): string {
  return address ? `${API_SETTINGS_KEY_PREFIX}-${address.toLowerCase()}` : GLOBAL_API_SETTINGS_KEY;
}

export function useApiSettings() {
  const { address } = useAccount();
  const [settings, setSettings] = useState<ApiSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Get the appropriate storage key based on wallet connection
  const storageKey = getWalletApiSettingsKey(address);

  // Load settings from localStorage on mount or when wallet changes
  useEffect(() => {
    loadSettings();
  }, [address]); // Re-run when wallet address changes

  // Load settings from appropriate storage location
  const loadSettings = useCallback(() => {
    try {
      setIsLoaded(false);
      
      // First try to load wallet-specific settings
      let storedSettings = localStorage.getItem(storageKey);
      
      // If no wallet-specific settings, but we have a wallet connected,
      // try to load from global settings as a fallback
      if (!storedSettings && address) {
        storedSettings = localStorage.getItem(GLOBAL_API_SETTINGS_KEY);
      }
      
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(parsedSettings);
        console.log("Loaded API settings from", address ? "wallet storage" : "global storage");
      } else {
        // If no settings found anywhere, use defaults
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Failed to load API settings from localStorage:", error);
      setSettings(defaultSettings);
    } finally {
      setIsLoaded(true);
    }
  }, [address, storageKey]);

  // Save settings to appropriate localStorage location
  const saveSettings = useCallback((newSettings: ApiSettings) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newSettings));
      setSettings(newSettings);
      console.log("Saved API settings to", address ? "wallet storage" : "global storage");
    } catch (error) {
      console.error("Failed to save API settings to localStorage:", error);
    }
  }, [storageKey, address]);

  // Delete settings from localStorage
  const clearSettings = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setSettings(defaultSettings);
      console.log("Cleared API settings from", address ? "wallet storage" : "global storage");
    } catch (error) {
      console.error("Failed to clear API settings from localStorage:", error);
    }
  }, [storageKey, address]);

  // Check if settings have been configured
  const isConfigured = Boolean(settings.apiKey && settings.baseUrl && settings.modelName);

  return {
    settings,
    saveSettings,
    clearSettings,
    isConfigured,
    isLoaded,
    isWalletSpecific: !!address
  };
}