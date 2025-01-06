export const DEFAULT_CACHE_TIME =
  process.env.NODE_ENV === 'development' ? 60 * 60 * 3 /** 3 hours */ : 60 * 60; // 1 hour

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
