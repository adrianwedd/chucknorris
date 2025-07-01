
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

  let responses = [];
  rl.on('line', (line) => {
    try {
      const response = JSON.parse(line);
      responses.push(response);
    } catch (error) {
      // Ignore non-JSON output
    }
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
        name: 'session-isolation-test',
        version: '1.0.0'
      }
    }
  };
  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

  // Let the server process the request
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send two concurrent requests with different LLM names
  const request1 = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'easyChuckNorris',
      arguments: { llmName: 'ANTHROPIC' },
    },
  };
  const request2 = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'easyChuckNorris',
      arguments: { llmName: 'GOOGLE' },
    },
  };

  serverProcess.stdin.write(JSON.stringify(request1) + '\n');
  serverProcess.stdin.write(JSON.stringify(request2) + '\n');

  // Let the server process the requests
  await new Promise(resolve => setTimeout(resolve, 2000));

  serverProcess.kill('SIGINT');

  const response1 = responses.find(r => r.id === 1);
  const response2 = responses.find(r => r.id === 2);

  if (response1 && response2 && response1.result.content[0].text !== response2.result.content[0].text) {
    console.log('Test passed: Session isolation is working correctly.');
  } else {
    console.error('Test failed: Session isolation is not working correctly.');
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
