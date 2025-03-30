import axios from 'axios';
import { DApp } from '@/types/dapp';

// DefiLlama APIのベースURL
const DEFILLAMA_BASE_URL = 'https://api.llama.fi';

// APIクライアントの作成
const createApiClient = () => {
  return axios.create({
    baseURL: DEFILLAMA_BASE_URL,
    headers: {
      'accept': '*/*',
    },
  });
};

// DefiLlamaからプロトコル（dApps）のリストを取得
export const fetchDappsFromDappRadar = async (
  category?: string,
  limit: number = 50,
  offset: number = 0
): Promise<DApp[]> => {
  try {
    const client = createApiClient();
    const response = await client.get('/protocols');

    if (response.data && Array.isArray(response.data)) {
      let protocols = response.data;
      
      // カテゴリーでフィルタリング
      if (category && category !== 'All') {
        protocols = protocols.filter((p: any) => p.category === category);
      }

      // ページネーション
      protocols = protocols.slice(offset, offset + limit);

      // DefiLlamaのレスポンスを私たちのDAppモデルに変換
      return protocols.map((protocol: any) => ({
        id: protocol.slug,
        name: protocol.name,
        category: protocol.category || '',
        subcategory: '', // DefiLlamaにはサブカテゴリーの概念がない
        description: protocol.description || '',
        website: protocol.url || '',
        image: protocol.logo || '',
        stats: {
          users: formatNumber(protocol.extraAttributes?.users24h || 0),
          activity: getActivityLevel(protocol.extraAttributes?.users24h || 0),
          volume: formatCurrency(protocol.volumeUSD24h || 0),
          balance: formatCurrency(protocol.tvl || 0)
        },
        chains: protocol.chains || [],
        tags: [protocol.category].filter(Boolean)
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching protocols from DefiLlama:', error);
    throw error;
  }
};

// ランダムなプロトコルを取得
export const fetchRandomDAppFromDappRadar = async (category?: string): Promise<DApp> => {
  try {
    const dapps = await fetchDappsFromDappRadar(category, 50);
    
    if (dapps.length === 0) {
      throw new Error('No protocols found');
    }
    
    const randomIndex = Math.floor(Math.random() * dapps.length);
    return dapps[randomIndex];
  } catch (error) {
    console.error('Error fetching random protocol:', error);
    throw error;
  }
};

// トレンドのプロトコルを取得（TVL変動率でソート）
export const fetchTrendingDappsFromDappRadar = async (limit: number = 5): Promise<DApp[]> => {
  try {
    const client = createApiClient();
    const response = await client.get('/protocols');

    if (response.data && Array.isArray(response.data)) {
      // TVLの24時間変動率でソート
      const sortedProtocols = response.data
        .filter((p: any) => p.tvl > 0 && p.change_1d !== null)
        .sort((a: any, b: any) => b.change_1d - a.change_1d)
        .slice(0, limit);

      return sortedProtocols.map((protocol: any) => ({
        id: protocol.slug,
        name: protocol.name,
        category: protocol.category || '',
        subcategory: '',
        description: protocol.description || '',
        website: protocol.url || '',
        image: protocol.logo || '',
        stats: {
          users: formatNumber(protocol.extraAttributes?.users24h || 0),
          activity: getActivityLevel(protocol.extraAttributes?.users24h || 0),
          volume: formatCurrency(protocol.volumeUSD24h || 0),
          balance: formatCurrency(protocol.tvl || 0)
        },
        chains: protocol.chains || [],
        tags: [protocol.category].filter(Boolean)
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching trending protocols:', error);
    throw error;
  }
};

// プロトコルの詳細情報を取得
export const fetchDappDetails = async (protocolId: string): Promise<DApp | null> => {
  try {
    const client = createApiClient();
    const response = await client.get(`/protocol/${protocolId}`);

    if (response.data) {
      const protocol = response.data;
      
      return {
        id: protocol.slug,
        name: protocol.name,
        category: protocol.category || '',
        subcategory: '',
        description: protocol.description || '',
        website: protocol.url || '',
        image: protocol.logo || '',
        stats: {
          users: formatNumber(protocol.extraAttributes?.users24h || 0),
          activity: getActivityLevel(protocol.extraAttributes?.users24h || 0),
          volume: formatCurrency(protocol.volumeUSD24h || 0),
          balance: formatCurrency(protocol.tvl || 0)
        },
        chains: protocol.chains || [],
        tags: [protocol.category].filter(Boolean),
        // 詳細情報の追加フィールド
        socialLinks: {
          twitter: protocol.twitter || '',
          discord: protocol.discord || '',
          telegram: protocol.telegram || ''
        },
        auditInfo: protocol.audit_links || [],
        launchDate: protocol.date_launched || null
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching protocol details for ID ${protocolId}:`, error);
    throw error;
  }
};

// カテゴリーリストを取得
export const fetchDappCategories = async (): Promise<string[]> => {
  try {
    const client = createApiClient();
    const response = await client.get('/protocols');

    if (response.data && Array.isArray(response.data)) {
      const categories = ['All'];
      const categorySet = new Set(response.data
        .map((p: any) => p.category)
        .filter(Boolean));
      
      return [...categories, ...Array.from(categorySet)];
    }
    
    return ['All', 'DeFi', 'NFT', 'Gaming', 'Marketplace', 'Social', 'Other'];
  } catch (error) {
    console.error('Error fetching protocol categories:', error);
    return ['All', 'DeFi', 'NFT', 'Gaming', 'Marketplace', 'Social', 'Other'];
  }
};

// ユーティリティ関数
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
};

const getActivityLevel = (users: number): string => {
  if (users >= 10000) {
    return 'High';
  } else if (users >= 1000) {
    return 'Medium';
  }
  return 'Low';
};
