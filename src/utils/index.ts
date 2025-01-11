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

export function calculateAgeFromDate(dt: string): string {
  const date = new Date(dt);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (minutes < 60) {
    return `${minutes} minutes`;
  } else if (hours < 24) {
    return `${hours} hours`;
  } else if (days < 30) {
    return `${days} days`;
  } else if (days < 365) {
    return `${months} months`;
  } else {
    return `${years} years`;
  }
}

export function getNonWETHToken(tokenA: string, tokenB: string) {
  if (tokenA === '0x4200000000000000000000000000000000000006')
    return {
      baseToken: tokenB,
      quoteToken: tokenA,
      aWasWETH: true,
    };

  return {
    baseToken: tokenA,
    quoteToken: tokenB,
    aWasWETH: false,
  };
}
