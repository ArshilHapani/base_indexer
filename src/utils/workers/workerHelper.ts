import { Worker } from 'node:worker_threads';
import type { Block } from 'ethers';

import provider from '../ethers';

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

export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Function[] = [];
  private readonly maxWorkers: number;
  private activeWorkers = 0;

  constructor(maxWorkers = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = maxWorkers;
  }

  async processLog(log: LogData, block: Block | null): Promise<ParsedLog> {
    return new Promise((resolve, reject) => {
      const runTask = () => {
        const worker = new Worker(new URL('./worker.ts', import.meta.url), {
          workerData: { log, block },
        });

        worker.on('message', (result) => {
          this.activeWorkers--;
          worker.terminate();
          this.processNextTask();
          resolve(result);
        });

        worker.on('error', (error) => {
          this.activeWorkers--;
          worker.terminate();
          this.processNextTask();
          reject(error);
        });

        this.workers.push(worker);
        this.activeWorkers++;
      };

      if (this.activeWorkers < this.maxWorkers) {
        runTask();
      } else {
        this.queue.push(runTask);
      }
    });
  }

  private processNextTask() {
    if (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
      const nextTask = this.queue.shift();
      nextTask?.();
    }
  }

  terminate() {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.queue = [];
    this.activeWorkers = 0;
  }
}

export function useWorkerPool(logs: any[]) {
  const workerPool = new WorkerPool();
  try {
    const promises = logs.map(async (log) => {
      const block = await provider().getBlock(log.blockNumber);
      return workerPool.processLog(log, block);
    });

    return Promise.all(promises);
  } catch (e: any) {
    console.log(`Error at "useWorkerPool" controller`, e.message);
    return [];
  } finally {
    workerPool.terminate();
  }
}
