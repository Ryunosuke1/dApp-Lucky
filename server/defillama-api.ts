import axios from 'axios';
import { DApp } from '@shared/schema';

// DeFiLlama Protocol Types
interface DefiLlamaProtocol {
  id: string;
  name: string;
  address?: string;
  symbol?: string;
  url?: string;
  description?: string;
  chain?: string;
  logo?: string;
  category?: string;
  chains?: string[];
  tvl?: number;
  change_1d?: number;
  change_7d?: number;
  slug: string;
}

/**
 * DefiLlama API client
 * Uses the free, no-auth-required APIs from DefiLlama
 */
export class DefiLlamaApi {
  private readonly baseUrl = 'https://api.llama.fi';
  
  /**
   * Get all protocols from DefiLlama
   */
  async getAllProtocols(): Promise<DefiLlamaProtocol[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/protocols`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching protocols from DefiLlama:', error);
      return [];
    }
  }
  
  /**
   * Get a random protocol from DefiLlama
   * @param category Optional category filter
   */
  async getRandomProtocol(category?: string): Promise<DApp | null> {
    try {
      const protocols = await this.getAllProtocols();
      
      // Filter by category if provided
      const filteredProtocols = category
        ? protocols.filter(p => 
            p.category && p.category.toLowerCase() === category.toLowerCase())
        : protocols;
      
      if (filteredProtocols.length === 0) {
        return null;
      }
      
      // Get a random protocol
      const randomIndex = Math.floor(Math.random() * filteredProtocols.length);
      const protocol = filteredProtocols[randomIndex];
      
      // Convert to DApp format
      return this.mapProtocolToDApp(protocol);
    } catch (error) {
      console.error('Error fetching random protocol:', error);
      return null;
    }
  }
  
  /**
   * Get trending protocols based on 7d change
   * @param limit Number of protocols to return
   */
  async getTrendingProtocols(limit = 5): Promise<DApp[]> {
    try {
      const protocols = await this.getAllProtocols();
      
      // Sort by 7d change
      const sortedProtocols = [...protocols]
        .filter(p => p.change_7d !== undefined && !isNaN(p.change_7d))
        .sort((a, b) => {
          const changeA = a.change_7d || 0;
          const changeB = b.change_7d || 0;
          return changeB - changeA;
        })
        .slice(0, limit);
      
      // Convert to DApp format
      return sortedProtocols.map(this.mapProtocolToDApp);
    } catch (error) {
      console.error('Error fetching trending protocols:', error);
      return [];
    }
  }
  
  /**
   * Map a DefiLlama protocol to our app's DApp format
   */
  private mapProtocolToDApp(protocol: DefiLlamaProtocol): DApp {
    return {
      id: protocol.slug,
      name: protocol.name,
      description: protocol.description || undefined,
      category: protocol.category || undefined,
      website: protocol.url || undefined,
      image: protocol.logo || undefined,
      stats: protocol.tvl ? {
        volume: `$${(protocol.tvl / 1000000).toFixed(2)}M TVL`,
        activity: protocol.change_1d !== undefined ? `${protocol.change_1d.toFixed(2)}% (24h)` : undefined,
      } : undefined,
      chains: protocol.chains || [],
      tags: protocol.category ? [protocol.category] : [],
    };
  }
}

// Export singleton instance
export const defiLlamaApi = new DefiLlamaApi();