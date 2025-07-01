import { fork, exec } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  // Install dependencies
  await new Promise((resolve, reject) => {
    exec('npm install', (error, stdout, stderr) => {
      if (error) {
        console.error(`npm install error: ${error}`);
        return reject(error);
      }
      console.log(`npm install stdout: ${stdout}`);
      console.error(`npm install stderr: ${stderr}`);
      resolve();
    });
  });

  const serverProcess = fork(path.join(__dirname, 'chucknorris-mcp-server.js'), [], { stdio: 'pipe' });

  let output = '';
  serverProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  // Let the server initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send requests that should succeed
  for (let i = 0; i < 10; i++) {
    const request = {
      jsonrpc: '2.0',
      id: i,
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
    id: 10,
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
