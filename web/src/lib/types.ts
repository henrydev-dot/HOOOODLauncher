export type LayoutScheme = "arcade" | "terminal" | "vitrine";

export interface LauncherFeatures {
  chat: boolean;
  kingOfTheHill: boolean;
  antiSniper: boolean;
  liveTicker: boolean;
  socialLinks: boolean;
}

export interface SocialLinks {
  x?: string;
  telegram?: string;
  website?: string;
}

export interface Launcher {
  id: number;
  slug: string;
  name: string;
  description: string;
  owner: string;
  feeRecipient: string;
  launcherFeeBps: number;
  themeColor: string;
  scheme: LayoutScheme;
  mascotId: string;
  logoDataUrl?: string;
  features: LauncherFeatures;
  social: SocialLinks;
  createdAt: number;
  tokenCount: number;
  volume24h: number; // HOODIE
  volumeTotal: number; // HOODIE
}

export interface TokenInfo {
  address: string;
  launcherSlug: string;
  launcherId: number;
  name: string;
  symbol: string;
  description: string;
  mascotId: string;
  logoDataUrl?: string;
  creator: string;
  createdAt: number;
  social: SocialLinks;
  // curve state (18-dec strings so mock data survives JSON)
  realHoodieReserve: string;
  virtualHoodieReserve: string;
  virtualTokenReserve: string;
  graduated: boolean;
  pairAddress?: string;
  progressBps: number;
  priceHoodie: number;
  marketCapHoodie: number;
  volume24h: number;
  holders: number;
}

export interface Trade {
  id: string;
  token: string;
  tokenSymbol: string;
  trader: string;
  isBuy: boolean;
  hoodieAmount: number;
  tokenAmount: number;
  timestamp: number;
}

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Holder {
  address: string;
  balance: number;
  pct: number;
}

export interface PlatformStats {
  totalLaunchers: number;
  totalTokens: number;
  totalVolumeHoodie: number;
  graduatedTokens: number;
}

export type Timeframe = "1m" | "5m" | "1h" | "1d";
