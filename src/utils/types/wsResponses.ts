export interface RequiredPoolData {
  pairAddress: string;
  quoteTokenAddress: string;
  baseTokenInfo: {
    address: string;
    name: string;
    symbol: string;
    decimals: number | string;
    logo: string;
    liquidityInUSD: string | number;
    holdersCount: number | string;
    tx24h: number | string;
    volume24h: string | number;
    age: string;
    timestamp: number | string;
  };
  priceInfo: {
    priceUSDC: string | number;
    priceChange5m: string | number;
    priceChange1h: string | number;
    priceChange6h: string | number;
    priceChange24h: string | number;
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
