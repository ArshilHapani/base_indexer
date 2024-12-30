import { ethers } from 'ethers';

let provider: ethers.JsonRpcProvider | null = null;

const getProvider = (): ethers.JsonRpcProvider => {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(
      process.env.MAINNET_BASE_ALCHEMY_RPC_URL
    );
  }
  return provider;
};

export default getProvider;
