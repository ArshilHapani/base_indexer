import getOrSetCacheRedis from './getOrSetRedisCache';

export async function getTokenMetadata(address: string): Promise<{
  decimals: number | null;
  logo: string | null;
  name: string | null;
  symbol: string | null;
}> {
  try {
    return getOrSetCacheRedis(`token-metadata-${address}`, async function () {
      const req = await fetch(process.env.MAINNET_BASE_ALCHEMY_RPC_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getTokenMetadata',
          params: [address],
        }),
      });
      return (await req.json())?.result;
    });
  } catch (e: any) {
    console.log(`Error at "getTokenMetadata" helper`, e.message);
    return {
      decimals: null,
      logo: null,
      name: null,
      symbol: null,
    };
  }
}

export async function getTransactionCount(address: string) {
  const ans = await getOrSetCacheRedis(
    `transaction-count-${address}`,
    async function () {
      const req = await fetch(process.env.MAINNET_BASE_ALCHEMY_RPC_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'eth_getTransactionCount',
          params: [address],
        }),
      });
      return await req.json();
    },
  );
  return parseInt(ans?.result ?? '0x0', 16);
}
