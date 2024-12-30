/**
 * This file contains types for all external API responses.
 */

interface Token {
  address: string;
  price: number;
  priceToken: number;
  priceTokenString: string;
  logo?: string;
  approximateReserveUSD: number;
  approximateReserveTokenRaw: string;
  approximateReserveToken: number;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: number;
  circulatingSupply: number;
  id?: number; // Optional, as it might not exist for all tokens
}

interface Pair {
  token0: Token;
  token1: Token;
  volume24h: number;
  liquidity: number;
  blockchain: string;
  address: string;
  createdAt: string;
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
}

export interface Coin {
  name: string;
  symbol: string;
  address: string;
  blockchain: string;
  decimals: number;
  volume_24h: number;
  listed_at: string;
  pairs: Pair[];
}
