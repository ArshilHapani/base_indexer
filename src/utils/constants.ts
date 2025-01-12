export const DEFAULT_CACHE_TIME =
  process.env.NODE_ENV === 'development' ? 60 * 60 * 3 /** 3 hours */ : 60 * 60; // 1 hour

export const WETH_ADDRESS_BASE = '0x4200000000000000000000000000000000000006';
export const V3_WETH_USD_POOL_ADDRESS =
  '0xd0b53D9277642d899DF5C87A3966A349A798F224';

/**
 * Basic abi to get call the balanceOf and other function on smart contract
 */
export const tokenABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
];

export const uniswapV3FactoryABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
];
export const uniswapV3PoolABI = [
  'function liquidity() external view returns (uint128)',
];

export const uniswapV3FactoryAddressBase =
  '0x33128a8fC17869897dcE68Ed026d694621f6FDfD';

export const uniswapV2RouterAddress =
  '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24';

export const FEE = 3000; // Fee tier (3000 = 0.3%)

export const uniswapV2FactoryAddress =
  '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6'; // base mainnet
export const uniswapV2FactoryABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
];
export const uniswapV2PairABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

export const uniswapV2RouterABI = [
  'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory)',
];
