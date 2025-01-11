import { spawn, type Subprocess } from 'bun';

import type { ChannelTypes } from '@/websocket';

const tasks = new Map<ChannelTypes, Subprocess>();

/**
 * This function is used to run the specific cron job which are stored in `tasks/cron` directory
 * @param filePath - the path of the file which needs to be run
 * @param processName - the name of the process which is running (it is the same as the channel name)
 */
export function spawnProcess(filePath: string, processName: ChannelTypes) {
  try {
    if (tasks.has(processName)) {
      console.log(`Process ${processName} is already running`);
      return;
    }
    const spawnedProcess = spawn(['bun', 'run', filePath], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(`Started ${filePath}`);
    tasks.set(processName, spawnedProcess);
  } catch (e: any) {
    console.log(`Error in spawnProcess: ${e.message}`);
  }
}

export function killProcess(processName: ChannelTypes) {
  const process = tasks.get(processName);
  if (!process) {
    console.log(`Process ${processName} is not running`);
    return;
  }

  process.kill();
  tasks.delete(processName);
  console.log(`Stopped ${processName}`);
}
