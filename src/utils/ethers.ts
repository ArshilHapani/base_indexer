import { ethers } from 'ethers';

let providerInstance: ethers.JsonRpcProvider | null = null;

const getProvider = (): ethers.JsonRpcProvider => {
  if (!providerInstance) {
    providerInstance = new ethers.JsonRpcProvider(
      process.env.MAINNET_BASE_ALCHEMY_RPC_URL!
    );
  }
  return providerInstance;
};

const provider = getProvider();
export default provider;
