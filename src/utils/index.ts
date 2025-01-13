import viemClient from './viem';

export function verifyAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function parseLogs(logs: any[]) {
  return await Promise.all(
    logs.map(async function (log) {
      const from = `0x${log.topics[1].slice(26)}`;
      const to = `0x${log.topics[2].slice(26)}`;
      const value = parseInt(log.data, 16);

      const block = await viemClient.getBlock({
        blockNumber: log.blockNumber,
      }); // network req.
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

export function calculateAgeFromDate(dt: string | number): string {
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

/**
 *
 * @param tokenA tokenA from the pair
 * @param tokenB tokenB from the pair
 * @returns object with baseToken, quoteToken and aWasWETH, where aWasWETH is true if tokenA is WETH and quoteToken is WETH
 */
export function getNonWETHToken(tokenA: string, tokenB: string) {
  if (tokenA === '0x4200000000000000000000000000000000000006')
    return {
      baseToken: tokenB,
      quoteToken: tokenA,
      aWasWETH: true,
      weth: tokenA,
      otherToken: tokenB,
    };

  return {
    baseToken: tokenA,
    quoteToken: tokenB,
    aWasWETH: false,
    weth: tokenB,
    otherToken: tokenA,
  };
}

/**
 * This function calculates the price of token0 in token1 and token1 in token0 using uniswap v3 math
 *
 * For more info read - https://blog.uniswap.org/uniswap-v3-math-primer/
 * @param PoolInfo Basic information to calculate the price
 * @returns price0In1, price1In0, price0In1Wei, price1In0Wei
 */
export function getPriceFromSqrtX96(PoolInfo: {
  SqrtX96: string | number | bigint;
  Decimal0: number;
  Decimal1: number;
}) {
  try {
    const sqrtPriceX96 = BigInt(PoolInfo.SqrtX96);
    const Q96 = BigInt(2) ** BigInt(96);

    const squaredPrice = sqrtPriceX96 * sqrtPriceX96;
    const Q96Squared = Q96 * Q96;

    const decimal0Adjustment = BigInt(10) ** BigInt(PoolInfo.Decimal0);
    const decimal1Adjustment = BigInt(10) ** BigInt(PoolInfo.Decimal1);

    const price0In1Calc = parseFloat(
      (
        (squaredPrice * decimal0Adjustment) /
        (Q96Squared * decimal1Adjustment)
      ).toString()
    );
    const price1In0Calc = parseFloat(
      (
        (Q96Squared * decimal1Adjustment) /
        (squaredPrice * decimal0Adjustment)
      ).toString()
    );

    const price0In1WeiCalc = price0In1Calc * Number(decimal1Adjustment);
    const price1In0WeiCalc = price1In0Calc * Number(decimal0Adjustment);

    const price0In1 = price0In1Calc;
    const price1In0 = price1In0Calc;
    const price0In1Wei = price0In1WeiCalc;
    const price1In0Wei = price1In0WeiCalc;

    return {
      price0In1,
      price1In0,
      price0In1Wei,
      price1In0Wei,
    };
  } catch (error) {
    console.error('Error in getPriceFromSqrtX96:', error);
    throw error;
  }
}

export async function getTokenNativePrice(
  tokenPriceInUsd: number,
  ethPriceInUsd: number
) {
  return tokenPriceInUsd / ethPriceInUsd;
}
