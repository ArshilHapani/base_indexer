export const DEFAULT_CACHE_TIME =
  process.env.NODE_ENV === 'development' ? 60 * 60 * 3 /** 3 hours */ : 60 * 60; // 1 hour

export const WETH_ADDRESS_BASE = '0x4200000000000000000000000000000000000006';
export const V3_WETH_USD_POOL_ADDRESS =
  '0xd0b53D9277642d899DF5C87A3966A349A798F224';
export const BASE_ETH_USD_PRICE_FEED_AGGREGATOR_ADDRESS_CHAINLINK =
  '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70';

export const uniswapV3FactoryAddressBase =
  '0x33128a8fC17869897dcE68Ed026d694621f6FDfD';

export const uniswapV2RouterAddress =
  '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24';

export const FEE = 3000; // Fee tier (3000 = 0.3%)

export const uniswapV2FactoryAddress =
  '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6'; // base mainnet
