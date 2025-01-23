import { WebSocket } from 'ws';
import { decodeEventLog } from 'viem';

import factoryContractABI from '@/abi/V2Factory.json';
import viemClient from '@/utils/viem';
import db from '@/utils/db';
import type { WsMessage } from '@/websocket';
import getPairDataByAddress from '@/utils/helpers/getPairDataByAddress';

const ROUTER_CONTRACT_ADDRESS = '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6';

const ws = new WebSocket(
  process.env.WEBSOCKET_SERVER_URL ?? 'ws://localhost:5000'
);

const createChannelData: WsMessage = {
  type: 'createChannel',
  channel: 'latestPairs',
  payload: null,
};
ws.on('open', () => {
  ws.send(JSON.stringify(createChannelData));
});

export async function watchEventOnContract() {
  viemClient.watchContractEvent({
    address: ROUTER_CONTRACT_ADDRESS,
    abi: factoryContractABI,
    eventName: 'PairCreated',
    pollingInterval: 3000, // 3 second
    onLogs: (logs) => {
      console.log(`logs received: ${logs.length}`);
      logs.forEach((log) => {
        (async function () {
          const timeStamp =
            Number(
              (
                await viemClient.getBlock({
                  blockHash: log.blockHash ?? '0x',
                })
              ).timestamp
            ) * 1000;

          const data = decodeEventLog({
            abi: factoryContractABI,
            eventName: 'PairCreated',
            topics: log.topics,
            data: log.data,
            strict: true,
          });

          if (data && data.args) {
            const [token0, token1, pairAddress] = data.args as `0x${string}`[];
            const wsData = await getPairDataByAddress(
              pairAddress,
              token0,
              token1,
              log.transactionHash ?? '',
              timeStamp
            );
            const wsDataFormatted: WsMessage = {
              type: 'publishToChannel',
              channel: 'latestPairs',
              payload: wsData,
            };

            ws.send(JSON.stringify(wsDataFormatted));

            /* storing data in db (function execution is not awaited, so it will sends the response to client without waiting for db operation)
             */
            const existingPair = await db.pair.findFirst({
              // for development only (to prevent duplicate data)
              where: {
                pairAddress,
              },
            });
            if (existingPair == null) {
              await db.pair.create({
                data: {
                  tokenA: token0,
                  tokenB: token1,
                  pairAddress,
                  chainId: 8453,
                  createdAt: new Date(timeStamp),
                },
              });
              console.log(`Pair created`, data.args[3]);
            }
          }
        })();
      });
    },
  });
}

watchEventOnContract();

/**
 * Require data
 *
 * pair_address
 * dex_name
 * pair_creation_tx_hash (missing)
 * base_token
 * quote_token
 * creation_time
 * base_token_details -> name, symbol, uri, address, user, website, twitter
 * market_data -> liquidity, total_holders, tx_1h, volume_1h, market_cap
 */
