import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { MetaMaskSDK } from '@metamask/sdk';
import { createWalletClient, custom } from 'viem';

// Use RainbowKit's getDefaultConfig for wagmi v2 compatibility
const chains = [mainnet, polygon, optimism, arbitrum];

// Initialize MetaMask SDK
export const initializeMetaMaskSDK = () => {
  const MMSDK = new MetaMaskSDK({
    dappMetadata: {
      name: 'dApp Lucky',
      url: window.location.href,
    },
    // Using the right extensionOnly flag to prioritize the extension
    extensionOnly: true, 
    // Optional: Customize the connection popup
    useDeeplink: false,
    // Required for mobile wallets
    checkInstallationImmediately: false,
  });

  return MMSDK.getProvider();
};

// Get the provider from MetaMask SDK instead of relying on window.ethereum
export const getMetaMaskProvider = () => {
  try {
    const provider = initializeMetaMaskSDK();
    return provider;
  } catch (error) {
    console.error('Error initializing MetaMask SDK:', error);
    return null;
  }
};

// With the WALLETCONNECT_PROJECT_ID from environment
export const wagmiConfig = getDefaultConfig({
  appName: 'dApp Lucky',
  projectId: import.meta.env.WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains,
});

export const SUPPORTED_CHAINS = chains;

// Create a wallet client with MetaMask SDK
export const createMetaMaskClient = async () => {
  const provider = getMetaMaskProvider();
  
  if (!provider) {
    throw new Error('MetaMask provider not available');
  }
  
  return createWalletClient({
    transport: custom(provider)
  });
};
