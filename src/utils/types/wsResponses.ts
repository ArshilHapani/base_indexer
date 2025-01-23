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

type BaseTokenDetails = {
  name: string;
  symbol: string;
  uri: string;
  mint: string;
  user: string;
  website?: string;
  twitter?: string;
};

type MarketData = {
  liquidity?: number | string;
  totalHolders?: number | string;
  tx_1h?: number | string;
  volume1H?: number | string;
  marketCap?: number | string;
};

export type Pair = {
  pairAddress: string;
  dexName: string;
  pairCreationTxHash: string;
  baseToken: string;
  quoteToken: string;
  creationTime: string;
  baseTokenDetails: BaseTokenDetails;
  marketData: MarketData;
};
