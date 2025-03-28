import { createConfig, http } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';
import { createStorage, cookieStorage } from 'wagmi';

// Define supported chains
export const chains = [mainnet, polygon, optimism, arbitrum];

// Create wagmi config for v2
export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, optimism, arbitrum],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
  },
  connectors: [
    metaMask()
  ],
  storage: createStorage({
    storage: cookieStorage
  })
});
