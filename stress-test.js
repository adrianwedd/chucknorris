import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NUM_CLIENTS = 10;
const DURATION_MS = 10000;

async function runTest() {
  const serverProcess = spawn('node', [path.join(__dirname, 'chucknorris-mcp-server.js')], { stdio: ['pipe', 'pipe', 'inherit'] });

  const clients = [];
  for (let i = 0; i < NUM_CLIENTS; i++) {
    const client = createInterface({
      input: serverProcess.stdout,
      crlfDelay: Infinity,
    });
    clients.push(client);
  }

  // Let the server initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  const startTime = Date.now();
  let requestsSent = 0;

  while (Date.now() - startTime < DURATION_MS) {
    for (let i = 0; i < NUM_CLIENTS; i++) {
      const request = {
        jsonrpc: '2.0',
        id: requestsSent++,
        method: 'tools/list',
        params: {},
      };
      serverProcess.stdin.write(JSON.stringify(request) + '\n');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  serverProcess.kill('SIGINT');

  console.log(`Stress test completed. Sent ${requestsSent} requests in ${DURATION_MS}ms.`);
}

runTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
