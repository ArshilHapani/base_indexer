import { createPublicClient, webSocket, fallback, http } from 'viem';
import { base } from 'viem/chains';

const wsProviderURL = webSocket(process.env.MAINNET_BASE_ALCHEMY_RPC_WS_URL);
const providerURL = http(process.env.MAINNET_BASE_ALCHEMY_RPC_URL);

const viemClient = createPublicClient({
  transport: fallback([wsProviderURL, providerURL]),
  chain: base,
});

export default viemClient;
