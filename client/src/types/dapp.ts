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
  };
  chains?: string[];
  tags?: string[];
}
