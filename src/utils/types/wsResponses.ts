export interface RequiredPoolData {
  pairAddress: string;
  quoteTokenAddress: string;
  baseTokenInfo: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logo: string;
    liquidityInUSD: string;
    holdersCount: number;
    tx24h: number;
    volume24h: string;
    age: string;
  };
  priceInfo: {
    priceUSDC: string;
    priceChange5m: string;
    priceChange1h: string;
    priceChange6h: string;
    priceChange24h: string;
  };
  audit: {
    isHoneyPot: boolean;
    isVerified: boolean;
    // remaining...
    renounced: boolean;
    locked: boolean;
    insiders: number;
  };
}
