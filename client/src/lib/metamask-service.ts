import { MetaMaskSDK, SDKProvider } from '@metamask/sdk';
import { DApp } from '@/types/dapp';

// MetaMask SDKのインスタンス
let metamaskSDK: MetaMaskSDK | null = null;
let provider: SDKProvider | null = null;

// お気に入りリストの保存キー
const FAVORITES_KEY = 'dapp-explorer-favorites';

// MetaMask SDKの初期化
export const initMetaMaskSDK = async (): Promise<SDKProvider | null> => {
  try {
    if (!metamaskSDK) {
      metamaskSDK = new MetaMaskSDK({
        dappMetadata: {
          name: 'dApp Explorer',
          url: window.location.href,
          iconUrl: 'https://example.com/icon.png', // アプリのアイコンURLに変更
        },
        logging: {
          developerMode: false,
        },
        checkInstallationImmediately: false,
        // 必要に応じて他のオプションを設定
      });
    }

    await metamaskSDK.init();
    provider = metamaskSDK.getProvider();
    return provider;
  } catch (error) {
    console.error('MetaMask SDK initialization error:', error);
    return null;
  }
};

// MetaMask SDKのプロバイダーを取得
export const getMetaMaskProvider = async (): Promise<SDKProvider | null> => {
  if (!provider) {
    return initMetaMaskSDK();
  }
  return provider;
};

// MetaMaskに接続
export const connectMetaMask = async (): Promise<string | null> => {
  try {
    const provider = await getMetaMaskProvider();
    if (!provider) {
      throw new Error('MetaMask provider not available');
    }

    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    if (accounts && Array.isArray(accounts) && accounts.length > 0) {
      return accounts[0] as string;
    }
    return null;
  } catch (error) {
    console.error('MetaMask connection error:', error);
    throw error;
  }
};

// お気に入りリストをMetaMaskに保存
export const saveFavoritesToMetaMask = async (favorites: { dapp: DApp, position: number }[]): Promise<boolean> => {
  try {
    const provider = await getMetaMaskProvider();
    if (!provider) {
      throw new Error('MetaMask provider not available');
    }

    // アカウントを取得
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const account = accounts[0];

    // お気に入りデータを準備
    const favoritesData = favorites.map(fav => ({
      id: fav.dapp.id,
      name: fav.dapp.name,
      category: fav.dapp.category,
      subcategory: fav.dapp.subcategory,
      description: fav.dapp.description,
      website: fav.dapp.website,
      image: fav.dapp.image,
      position: fav.position
    }));

    // データをJSON文字列に変換
    const dataStr = JSON.stringify(favoritesData);

    // MetaMaskのデータストアに保存
    await provider.request({
      method: 'eth_setData',
      params: [
        {
          key: `${FAVORITES_KEY}-${account}`,
          value: dataStr,
          signature: '' // 署名が必要な場合は実装
        }
      ]
    });

    return true;
  } catch (error) {
    console.error('Error saving favorites to MetaMask:', error);
    
    // eth_setDataがサポートされていない場合のフォールバック
    // ローカルストレージに保存
    try {
      const provider = await getMetaMaskProvider();
      if (!provider) {
        throw new Error('MetaMask provider not available');
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      
      // お気に入りデータを準備
      const favoritesData = favorites.map(fav => ({
        id: fav.dapp.id,
        name: fav.dapp.name,
        category: fav.dapp.category,
        subcategory: fav.dapp.subcategory,
        description: fav.dapp.description,
        website: fav.dapp.website,
        image: fav.dapp.image,
        position: fav.position
      }));

      // ローカルストレージに保存
      localStorage.setItem(`${FAVORITES_KEY}-${account}`, JSON.stringify(favoritesData));
      return true;
    } catch (fallbackError) {
      console.error('Fallback storage error:', fallbackError);
      return false;
    }
  }
};

// お気に入りリストをMetaMaskから読み込み
export const loadFavoritesFromMetaMask = async (): Promise<{ dapp: DApp, position: number }[] | null> => {
  try {
    const provider = await getMetaMaskProvider();
    if (!provider) {
      throw new Error('MetaMask provider not available');
    }

    // アカウントを取得
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const account = accounts[0];

    // MetaMaskのデータストアから読み込み
    const result = await provider.request({
      method: 'eth_getData',
      params: [
        {
          key: `${FAVORITES_KEY}-${account}`,
          signature: '' // 署名が必要な場合は実装
        }
      ]
    });

    if (result && typeof result === 'string') {
      const favoritesData = JSON.parse(result);
      
      // DAppオブジェクトに変換
      return favoritesData.map((item: any) => ({
        dapp: {
          id: item.id,
          name: item.name,
          category: item.category,
          subcategory: item.subcategory,
          description: item.description,
          website: item.website,
          image: item.image,
          // 他の必要なプロパティがあれば追加
        } as DApp,
        position: item.position
      }));
    }
    
    return null;
  } catch (error) {
    console.error('Error loading favorites from MetaMask:', error);
    
    // eth_getDataがサポートされていない場合のフォールバック
    // ローカルストレージから読み込み
    try {
      const provider = await getMetaMaskProvider();
      if (!provider) {
        throw new Error('MetaMask provider not available');
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      
      // ローカルストレージから読み込み
      const dataStr = localStorage.getItem(`${FAVORITES_KEY}-${account}`);
      if (dataStr) {
        const favoritesData = JSON.parse(dataStr);
        
        // DAppオブジェクトに変換
        return favoritesData.map((item: any) => ({
          dapp: {
            id: item.id,
            name: item.name,
            category: item.category,
            subcategory: item.subcategory,
            description: item.description,
            website: item.website,
            image: item.image,
            // 他の必要なプロパティがあれば追加
          } as DApp,
          position: item.position
        }));
      }
      
      return null;
    } catch (fallbackError) {
      console.error('Fallback storage error:', fallbackError);
      return null;
    }
  }
};

// お気に入りリストの順序を更新
export const updateFavoritesOrder = async (favorites: { dapp: DApp, position: number }[]): Promise<boolean> => {
  return saveFavoritesToMetaMask(favorites);
};

// お気に入りリストにdAppを追加
export const addFavorite = async (dapp: DApp, currentFavorites: { dapp: DApp, position: number }[]): Promise<boolean> => {
  // 既に存在するかチェック
  const exists = currentFavorites.some(fav => fav.dapp.id === dapp.id);
  if (exists) {
    return true; // 既に存在する場合は成功とみなす
  }
  
  // 新しい位置を計算（最後に追加）
  const newPosition = currentFavorites.length > 0 
    ? Math.max(...currentFavorites.map(fav => fav.position)) + 1 
    : 1;
  
  // 新しいお気に入りリストを作成
  const newFavorites = [
    ...currentFavorites,
    { dapp, position: newPosition }
  ];
  
  // 保存
  return saveFavoritesToMetaMask(newFavorites);
};

// お気に入りリストからdAppを削除
export const removeFavorite = async (dappId: string, currentFavorites: { dapp: DApp, position: number }[]): Promise<boolean> => {
  // 削除対象を除外
  const newFavorites = currentFavorites.filter(fav => fav.dapp.id !== dappId);
  
  // 位置を再計算
  const reorderedFavorites = newFavorites.map((fav, index) => ({
    ...fav,
    position: index + 1
  }));
  
  // 保存
  return saveFavoritesToMetaMask(reorderedFavorites);
};
