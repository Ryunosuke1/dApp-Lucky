/**
 * API Keys management for the application
 * These functions allow retrieving and storing API keys safely on the server-side
 */

/**
 * Available API providers
 */
export enum ApiProvider {
  DEFILLAMA = 'defillama',
  OPENAI = 'openai',
  OPENROUTER = 'openrouter',
}

/**
 * API Keys structure
 */
export interface ApiKeys {
  [ApiProvider.DEFILLAMA]?: string;
  [ApiProvider.OPENAI]?: string;
  [ApiProvider.OPENROUTER]?: string;
}

/**
 * Model settings interface for LLM providers
 */
export interface ModelSettings {
  baseUrl: string;
  modelName: string;
  apiKey?: string;
}

/**
 * Get API key for a specific provider
 */
export function getApiKey(provider: ApiProvider): string | undefined {
  switch (provider) {
    case ApiProvider.DEFILLAMA:
      return process.env.DEFILLAMA_API_KEY;
    case ApiProvider.OPENAI:
      return process.env.OPENAI_API_KEY;
    case ApiProvider.OPENROUTER:
      return process.env.OPENROUTER_API_KEY;
    default:
      return undefined;
  }
}

/**
 * Get model settings for LLM providers
 */
export function getModelSettings(provider: ApiProvider): ModelSettings | undefined {
  switch (provider) {
    case ApiProvider.OPENAI:
      return {
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        modelName: process.env.OPENAI_MODEL_NAME || 'gpt-4o',
        apiKey: process.env.OPENAI_API_KEY
      };
    case ApiProvider.OPENROUTER:
      return {
        baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        modelName: process.env.OPENROUTER_MODEL_NAME || 'openai/gpt-4o',
        apiKey: process.env.OPENROUTER_API_KEY
      };
    default:
      return undefined;
  }
}

/**
 * Check if an API key is available
 */
export function hasApiKey(provider: ApiProvider): boolean {
  const key = getApiKey(provider);
  return key !== undefined && key.length > 0;
}

/**
 * Get all available API keys
 */
export function getAllApiKeys(): ApiKeys {
  return {
    [ApiProvider.DEFILLAMA]: getApiKey(ApiProvider.DEFILLAMA),
    [ApiProvider.OPENAI]: getApiKey(ApiProvider.OPENAI),
    [ApiProvider.OPENROUTER]: getApiKey(ApiProvider.OPENROUTER),
  };
}