export interface DApp {
  id: string;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  website?: string;
  image?: string;
  stats?: {
    users?: string;
    activity?: string;
    volume?: string;
    balance?: string;
    tvl?: string;  // Total Value Locked (DefiLlama specific)
  };
  chains?: string[];
  tags?: string[];
  // DefiLlama固有のフィールド
  socialLinks?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
  };
  auditInfo?: string[];
  launchDate?: string | null;
}
