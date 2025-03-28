import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { http } from 'wagmi';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum],
  [http()]
);

const { connectors } = getDefaultWallets({
  appName: 'dApp Lucky',
  projectId: 'YOUR_PROJECT_ID', // In production, replace with a real WalletConnect projectId
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export const SUPPORTED_CHAINS = chains;
