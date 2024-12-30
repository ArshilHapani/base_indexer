import type { Block } from 'ethers';
import { isMainThread, workerData, parentPort } from 'node:worker_threads';

interface LogData {
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
}

interface ParsedLog {
  from: string;
  to: string;
  value: number;
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: string;
}

// Worker thread code
if (!isMainThread) {
  const { log, block } = workerData;

  const parseLog = (log: LogData, block: Block | null): ParsedLog => {
    const from = `0x${log.topics[1].slice(26)}`;
    const to = `0x${log.topics[2].slice(26)}`;
    const value = parseInt(log.data, 16);

    return {
      from,
      to,
      value,
      blockNumber: log.blockNumber,
      blockTimestamp: block?.timestamp || 0,
      transactionHash: log.transactionHash,
    };
  };

  const result = parseLog(log, block);
  parentPort?.postMessage(result);
}
