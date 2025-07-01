import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const children = new Map();

function spawnChild(scriptPath) {
  const child = fork(scriptPath, [], { stdio: 'pipe' });
  const childId = child.pid;
  children.set(childId, { child, lastHeartbeat: Date.now() });

  child.on('message', (message) => {
    if (message.type === 'heartbeat') {
      children.get(childId).lastHeartbeat = Date.now();
    }
  });

  child.on('exit', () => {
    children.delete(childId);
  });

  return child;
}

function monitorChildren(interval = 30000) {
  setInterval(() => {
    const now = Date.now();
    for (const [childId, { child, lastHeartbeat }] of children.entries()) {
      if (now - lastHeartbeat > interval * 2) {
        console.warn(`[WARN] Child process ${childId} has not sent a heartbeat in time. Terminating.`);
        child.kill('SIGINT');
      }
    }
  }, interval);
}

export { spawnChild, monitorChildren };