/**
 * This file contains types for all external API responses.
 */

export interface Token {
  address: string;
  tokenPriceUSD: string;
  tokenPriceNative: string;
  name: string;
  tokenData: {
    decimals: number;
    logo: string | null;
    name: string;
    symbol: string;
    totalSupply: string;
  };
  liquidityInUSD: string;
  poolCreatedAt: string;
  transactionCount: number;
}

/**
 * Gecko terminal response
 */
export type Pool = {
  id: string;
  type: string;
  attributes: {
    base_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_usd: string;
    quote_token_price_native_currency: string;
    base_token_price_quote_token: string;
    quote_token_price_base_token: string;
    address: string;
    name: string;
    pool_created_at: string;
    fdv_usd: string;
    market_cap_usd: string | null;
    price_change_percentage: {
      m5: string;
      h1: string;
      h6: string;
      h24: string;
    };
    transactions: {
      m5: {
        buys: number;
        sells: number;
        buyers: number;
        sellers: number;
      };
      m15: {
        buys: number;
        sells: number;
        buyers: number;
        sellers: number;
      };
      m30: {
        buys: number;
        sells: number;
        buyers: number;
        sellers: number;
      };
      h1: {
        buys: number;
        sells: number;
        buyers: number;
        sellers: number;
      };
      h24: {
        buys: number;
        sells: number;
        buyers: number;
        sellers: number;
      };
    };
    volume_usd: {
      m5: string;
      h1: string;
      h6: string;
      h24: string;
    };
    reserve_in_usd: string;
  };
  relationships: {
    base_token: {
      data: {
        id: string;
        type: string;
      };
    };
    quote_token: {
      data: {
        id: string;
        type: string;
      };
    };
    dex: {
      data: {
        id: string;
        type: string;
      };
    };
  };
};

type MobulaToken = {
  address: string;
  price?: number;
  priceToken: number;
  priceTokenString: string;
  logo?: string;
  approximateReserveUSD: number;
  approximateReserveTokenRaw: string;
  approximateReserveToken: number;
  symbol: string;
  name: string;
  id?: number;
  decimals: number;
  totalSupply?: number;
  circulatingSupply?: number;
};

type MobulaPair = {
  token0: MobulaToken;
  token1: MobulaToken;
  volume24h: number;
  liquidity: number;
  blockchain: string;
  address: string;
  type: string;
  baseToken: string;
  factory: string;
  quoteToken: string;
  price_change_5min: number;
  price_change_1h: number;
  price_change_4h: number;
  price_change_12h: number;
  price_change_24h: number;
  trades_5min: number;
  buys_5min: number;
  sells_5min: number;
  volume_5min: number;
  buy_volume_5min: number;
  sell_volume_5min: number;
  trades_1h: number;
  buys_1h: number;
  sells_1h: number;
  volume_1h: number;
  buy_volume_1h: number;
  sell_volume_1h: number;
  trades_4h: number;
  buys_4h: number;
  sells_4h: number;
  volume_4h: number;
  buy_volume_4h: number;
  sell_volume_4h: number;
  trades_12h: number;
  buys_12h: number;
  sells_12h: number;
  volume_12h: number;
  buy_volume_12h: number;
  sell_volume_12h: number;
  trades_24h: number;
  buys_24h: number;
  sells_24h: number;
  volume_24h: number;
  buy_volume_24h: number;
  sell_volume_24h: number;
};

export type MobulaAPIPoolType = {
  data: {
    name: string;
    symbol: string;
    address: string;
    blockchain: string;
    decimals: number;
    volume_24h: number;
    listed_at: string;
    pairs: MobulaPair[];
  }[];
};
