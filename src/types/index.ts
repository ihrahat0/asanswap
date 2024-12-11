export interface Token {
  symbol: string;
  address: string;
  logo?: string;
  name: string;
  price: number;
  priceChange24h: number;
  balance?: number;
}

export type ChainType = 'solana' | 'ethereum' | 'bsc' | 'polygon' | 'arbitrum' | 'base' | 'linea';

export interface ChainOption {
  name: string;
  logo: string;
}

export interface ChainOptions {
  [key: string]: ChainOption;
}

export interface SocialLink {
  label: string;
  url?: string;
  icon: React.ComponentType;
} 