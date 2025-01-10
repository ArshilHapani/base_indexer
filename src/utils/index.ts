import provider from './ethers';

export function verifyAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function parseLogs(logs: any[]) {
  return await Promise.all(
    logs.map(async function (log) {
      const from = `0x${log.topics[1].slice(26)}`;
      const to = `0x${log.topics[2].slice(26)}`;
      const value = parseInt(log.data, 16);

      const block = await provider.getBlock(log.blockNumber); // network req.
      const blockTimestamp = block?.timestamp;

      return {
        from,
        to,
        value,
        blockNumber: log.blockNumber,
        blockTimestamp,
        transactionHash: log.transactionHash,
      };
    })
  );
}

export function calculateAgeFromDate(dt: string) {
  const date = new Date(dt);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `${days} days`;
}
