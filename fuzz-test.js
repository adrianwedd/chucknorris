
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateRandomString(length) {
  return randomBytes(length).toString('hex');
}

async function runTest() {
  const serverProcess = spawn('node', [path.join(__dirname, 'chucknorris-mcp-server.js')], { stdio: ['pipe', 'pipe', 'inherit'] });

  const rl = createInterface({
    input: serverProcess.stdout,
    crlfDelay: Infinity,
  });

  let errors = [];
  rl.on('line', (line) => {
    try {
      const response = JSON.parse(line);
      if (response.error) {
        errors.push(response.error);
      }
    } catch (error) {
      // Ignore non-JSON output
    }
  });

  // Let the server initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send a series of malformed requests
  for (let i = 0; i < 100; i++) {
    const request = {
      jsonrpc: '2.0',
      id: i,
      method: generateRandomString(10),
      params: {
        [generateRandomString(5)]: generateRandomString(20),
      },
    };
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  }

  // Let the server process the requests
  await new Promise(resolve => setTimeout(resolve, 2000));

  serverProcess.kill('SIGINT');

  if (errors.length > 0) {
    console.log(`Test passed: Fuzz testing identified ${errors.length} potential issues.`);
  } else {
    console.error('Test failed: Fuzz testing did not identify any potential issues.');
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
