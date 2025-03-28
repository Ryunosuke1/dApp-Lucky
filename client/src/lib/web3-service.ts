import { createConfig, Chain } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

// Define supported chains as appropriate type
export const chains: [Chain, ...Chain[]] = [mainnet, polygon, optimism, arbitrum];

// Create wagmi config with only MetaMask connector
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    metaMask()
  ],
  ssr: false, // Disable Server-Side Rendering
});
