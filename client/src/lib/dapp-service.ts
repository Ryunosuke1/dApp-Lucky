import { DApp } from "@/types/dapp";

// Static dapps data
const dapps: DApp[] = [
  {
    id: "uniswap",
    name: "Uniswap",
    category: "DeFi",
    subcategory: "Exchange",
    description: "Uniswap is a decentralized cryptocurrency exchange that uses an automated market-making system instead of a traditional order book. It allows users to trade cryptocurrencies without an intermediary, directly from their own wallets.",
    website: "https://uniswap.org",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Uniswap_Logo.svg",
    stats: {
      users: "2.3M",
      activity: "High",
      volume: "$234M",
      balance: "$2.1B"
    },
    chains: ["Ethereum", "Polygon", "Arbitrum", "Optimism"],
    tags: ["DEX", "AMM", "Swap", "Liquidity"]
  },
  {
    id: "opensea",
    name: "OpenSea",
    category: "NFT",
    subcategory: "Marketplace",
    description: "OpenSea is the world's first and largest NFT marketplace where you can discover, collect, and sell extraordinary NFTs on multiple blockchains.",
    website: "https://opensea.io",
    image: "https://storage.googleapis.com/opensea-static/Logomark/OpenSea-Full-Logo%20(light).svg",
    stats: {
      users: "4.1M",
      activity: "Medium",
      volume: "$12M",
      balance: "$430M"
    },
    chains: ["Ethereum", "Polygon", "Solana"],
    tags: ["NFT", "Marketplace", "Art", "Gaming"]
  },
  {
    id: "aave",
    name: "Aave",
    category: "DeFi",
    subcategory: "Lending",
    description: "Aave is a decentralized non-custodial liquidity protocol where users can participate as depositors or borrowers. Depositors provide liquidity to the market to earn passive income, while borrowers can borrow in either an overcollateralized or undercollateralized fashion.",
    website: "https://aave.com",
    image: "https://cryptologos.cc/logos/aave-aave-logo.svg",
    stats: {
      users: "980K",
      activity: "Medium",
      volume: "$124M",
      balance: "$3.9B"
    },
    chains: ["Ethereum", "Polygon", "Avalanche", "Arbitrum"],
    tags: ["Lending", "Borrowing", "Interest", "Flash Loans"]
  },
  {
    id: "makerdao",
    name: "MakerDAO",
    category: "DeFi",
    subcategory: "Stablecoins",
    description: "MakerDAO is a decentralized organization dedicated to bringing stability to the cryptocurrency economy. The Maker Protocol employs a two-token system, DAI, a collateral-backed stablecoin, and MKR, a governance token.",
    website: "https://makerdao.com",
    image: "https://cryptologos.cc/logos/maker-mkr-logo.svg",
    stats: {
      users: "720K",
      activity: "Medium",
      volume: "$89M",
      balance: "$5.2B"
    },
    chains: ["Ethereum"],
    tags: ["Stablecoin", "DAI", "Governance", "CDP"]
  },
  {
    id: "axie-infinity",
    name: "Axie Infinity",
    category: "GameFi",
    subcategory: "Play-to-Earn",
    description: "Axie Infinity is a blockchain-based trading and battling game that is partially owned and operated by its players. The Axie Infinity universe revolves around breeding, raising, battling, and trading fantasy creatures called Axies.",
    website: "https://axieinfinity.com",
    image: "https://cryptologos.cc/logos/axie-infinity-axs-logo.svg",
    stats: {
      users: "2.8M",
      activity: "Medium",
      volume: "$34M",
      balance: "$350M"
    },
    chains: ["Ethereum", "Ronin"],
    tags: ["Gaming", "NFT", "Play-to-Earn", "Metaverse"]
  },
  {
    id: "compound",
    name: "Compound",
    category: "DeFi",
    subcategory: "Lending",
    description: "Compound is an algorithmic, autonomous interest rate protocol built for developers, to unlock a universe of open financial applications.",
    website: "https://compound.finance",
    image: "https://cryptologos.cc/logos/compound-comp-logo.svg",
    stats: {
      users: "630K",
      activity: "Medium",
      volume: "$45M",
      balance: "$1.8B"
    },
    chains: ["Ethereum"],
    tags: ["Lending", "Interest", "DeFi", "Yield"]
  },
  {
    id: "decentraland",
    name: "Decentraland",
    category: "Metaverse",
    subcategory: "Virtual World",
    description: "Decentraland is a decentralized virtual reality platform powered by the Ethereum blockchain. Users can create, experience, and monetize content and applications in the first-ever virtual world entirely owned by its users.",
    website: "https://decentraland.org",
    image: "https://cryptologos.cc/logos/decentraland-mana-logo.svg",
    stats: {
      users: "1.2M",
      activity: "Low",
      volume: "$5M",
      balance: "$210M"
    },
    chains: ["Ethereum"],
    tags: ["Metaverse", "Virtual Land", "NFT", "Gaming"]
  },
  {
    id: "pancakeswap",
    name: "PancakeSwap",
    category: "DeFi",
    subcategory: "Exchange",
    description: "PancakeSwap is a decentralized exchange native to BNB Chain, allowing users to trade cryptocurrencies, provide liquidity, stake tokens, and participate in lottery and prediction games.",
    website: "https://pancakeswap.finance",
    image: "https://cryptologos.cc/logos/pancakeswap-cake-logo.svg",
    stats: {
      users: "3.5M",
      activity: "High",
      volume: "$178M",
      balance: "$1.5B"
    },
    chains: ["BNB Chain", "Ethereum", "Arbitrum"],
    tags: ["DEX", "AMM", "Swap", "Yield Farming"]
  },
  {
    id: "ens",
    name: "ENS",
    category: "Infrastructure",
    subcategory: "Naming",
    description: "Ethereum Name Service is a distributed, open, and extensible naming system based on the Ethereum blockchain. ENS translates human-readable names like 'alice.eth' to machine-readable identifiers including Ethereum addresses.",
    website: "https://ens.domains",
    image: "https://cryptologos.cc/logos/ethereum-name-service-ens-logo.svg",
    stats: {
      users: "840K",
      activity: "Medium",
      volume: "$12M",
      balance: "$180M"
    },
    chains: ["Ethereum"],
    tags: ["Domain Names", "Identity", "Web3", "DNS"]
  },
  {
    id: "lens-protocol",
    name: "Lens Protocol",
    category: "Social",
    subcategory: "Network",
    description: "Lens Protocol is a decentralized social graph that allows creators to own their content and connections with their community. It provides the infrastructure for social media applications where users truly own their data.",
    website: "https://lens.xyz",
    image: "https://lens.xyz/static/images/lens-logo-dark.svg",
    stats: {
      users: "450K",
      activity: "Medium",
      volume: "$3M",
      balance: "$65M"
    },
    chains: ["Polygon"],
    tags: ["Social", "Content", "Profiles", "Web3"]
  }
];

// Categories for filtering
export const dappCategories = [
  "All", 
  "DeFi", 
  "NFT", 
  "GameFi", 
  "Metaverse", 
  "Infrastructure", 
  "Social"
];

// Fetch a random dApp
export async function fetchRandomDApp(category?: string | null): Promise<DApp> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredDapps = dapps;
  
  // Filter by category if provided
  if (category && category !== "All") {
    filteredDapps = dapps.filter(dapp => dapp.category === category);
  }
  
  // If no dapps match the category, return from all dapps
  if (filteredDapps.length === 0) {
    filteredDapps = dapps;
  }
  
  // Get a random dApp
  const randomIndex = Math.floor(Math.random() * filteredDapps.length);
  return filteredDapps[randomIndex];
}

// Fetch trending dApps
export async function fetchTrendingDApps(): Promise<DApp[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return a subset of dapps as "trending"
  return dapps.slice(0, 5);
}
