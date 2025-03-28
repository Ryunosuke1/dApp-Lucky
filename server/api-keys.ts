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