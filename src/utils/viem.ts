import { createPublicClient, webSocket, fallback, http } from 'viem';
import { base } from 'viem/chains';

const wsProviderURL = webSocket(process.env.MAINNET_BASE_ALCHEMY_RPC_WS_URL);
const providerURL = http(process.env.MAINNET_BASE_ALCHEMY_RPC_URL);
const allThatNodeProviderURL = http(process.env.MAINNET_BASE_ALL_THAT_NODE_RPC);

const viemClient = createPublicClient({
  transport: fallback([wsProviderURL, providerURL, allThatNodeProviderURL]),
  chain: base,
  pollingInterval: 10000, // 10 seconds
});

export default viemClient;
