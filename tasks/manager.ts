import { spawn, serve, Subprocess } from 'bun';

type TaskNames = 'tokenConsumer' | 'cron';
type TaskProcess = Subprocess | null;

const tasks: Record<TaskNames, TaskProcess> = {
  tokenConsumer: null,
  cron: null,
};

const logs: Record<TaskNames, string[]> = {
  tokenConsumer: [],
  cron: [],
};

function logOutput(taskName: TaskNames, stream: ReadableStream | null) {
  if (!stream) return;

  const reader = stream.getReader();

  (async function () {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const log = new TextDecoder().decode(value);
      logs[taskName].push(log);

      if (logs[taskName].length > 100) {
        logs[taskName].shift();
      }
    }
  })();
}

function startTask(taskName: TaskNames, scriptPath: string): string {
  if (tasks[taskName]) return `Task ${taskName} is already running`;
  const task = spawn(['bun', 'run', scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  logOutput(taskName, task.stdout);
  logOutput(taskName, task.stderr);

  tasks[taskName] = task;
  return `Task ${taskName} started`;
}

function stopProcess(taskName: TaskNames): string {
  const task = tasks[taskName];
  if (task) {
    task.kill();
    tasks[taskName] = null;
    return `Task ${taskName} stopped successfully`;
  }
  return `Task ${taskName} is not running`;
}

function getStatus(taskName: TaskNames): string {
  if (tasks[taskName]) return `Task ${taskName} is running`;
  return `Task ${taskName} is not running`;
}

function getLogs(taskName: TaskNames): string {
  return logs[taskName].join('\n') || `No logs for task ${taskName}`;
}

function main() {
  try {
    serve({
      port: process.env.MANAGER_PORT ?? 5010,
      fetch(request) {
        const url = new URL(request.url);
        const taskName = url.searchParams.get('task') as TaskNames;
        const command = url.pathname.slice(1) as
          | 'start'
          | 'stop'
          | 'status'
          | 'logs';

        if (!taskName || !['consumer', 'cron'].includes(taskName)) {
          return new Response("Invalid task name. Use 'consumer' or 'cron'.", {
            status: 400,
          });
        }
        switch (command) {
          case 'start':
            return new Response(startTask(taskName, `${taskName}.ts`));
          case 'stop':
            return new Response(stopProcess(taskName));
          case 'status':
            return new Response(getStatus(taskName));
          case 'logs':
            return new Response(getLogs(taskName));
          default:
            return new Response(
              'Invalid endpoint. Use /start, /stop, /status, or /logs.',
              { status: 404 }
            );
        }
      },
    });
    console.log('Manager is running on http://localhost:3050');
  } catch (e) {
    console.error(e);
  }
}
