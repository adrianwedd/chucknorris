import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  const serverProcess = spawn('node', [path.join(__dirname, 'chucknorris-mcp-server.js')], { stdio: ['pipe', 'pipe', 'inherit'] });

  const rl = createInterface({
    input: serverProcess.stdout,
    crlfDelay: Infinity,
  });

  let output = '';
  rl.on('line', (line) => {
    output += line;
  });

  // Let the server initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send initialize request
  const initRequest = {
    jsonrpc: '2.0',
    id: 0,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'rate-limit-test',
        version: '1.0.0'
      }
    }
  };
  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

  // Let the server process the request
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send requests that should succeed
  for (let i = 0; i < 10; i++) {
    const request = {
      jsonrpc: '2.0',
      id: i + 1,
      method: 'tools/list',
      params: {},
    };
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  }

  // Let the server process the requests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send a request that should be rate-limited
  const rateLimitedRequest = {
    jsonrpc: '2.0',
    id: 11,
    method: 'tools/list',
    params: {},
  };
  serverProcess.stdin.write(JSON.stringify(rateLimitedRequest) + '\n');

  // Let the server process the request
  await new Promise(resolve => setTimeout(resolve, 1000));

  serverProcess.kill('SIGINT');

  if (output.includes('TooManyRequests')) {
    console.log('Test passed: Rate limit exceeded as expected.');
  } else {
    console.error('Test failed: Rate limit was not triggered.');
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
