
import { fork, exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '.prompt-cache');

async function runTest() {
  // Clean up cache directory before starting
  await fs.rm(CACHE_DIR, { recursive: true, force: true });

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

  // --- Test 1: Caching enabled ---
  console.log('--- Running Test 1: Caching enabled ---');
  const serverProcess1 = fork(path.join(__dirname, 'chucknorris-mcp-server.js'), [], { stdio: 'pipe' });

  let server1Output = '';
  serverProcess1.stderr.on('data', (data) => {
    server1Output += data.toString();
  });

  // Let the server initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send a request to trigger a prompt fetch
  const callToolRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'easyChuckNorris',
      arguments: { llmName: 'ANTHROPIC' },
    },
  };
  serverProcess1.stdin.write(JSON.stringify(callToolRequest) + '\n');

  // Let the server process the request
  await new Promise(resolve => setTimeout(resolve, 2000));

  serverProcess1.kill('SIGINT');

  if (!server1Output.includes('Cached prompt to')) {
    console.error('Test 1 Failed: Did not cache prompt.');
    process.exit(1);
  }
  console.log('Test 1 Passed: Prompt was cached.');

  // --- Test 2: Caching disabled ---
  console.log('--- Running Test 2: Caching disabled ---');
  const serverProcess2 = fork(path.join(__dirname, 'chucknorris-mcp-server.js'), ['--no-cache'], { stdio: 'pipe' });

  let server2Output = '';
  serverProcess2.stderr.on('data', (data) => {
    server2Output += data.toString();
  });

  // Let the server initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send the same request
  serverProcess2.stdin.write(JSON.stringify(callToolRequest) + '\n');

  // Let the server process the request
  await new Promise(resolve => setTimeout(resolve, 2000));

  serverProcess2.kill('SIGINT');

  if (server2Output.includes('Cached prompt to')) {
    console.error('Test 2 Failed: Prompt was cached even with --no-cache.');
    process.exit(1);
  }
  console.log('Test 2 Passed: Prompt was not cached with --no-cache.');

  // Clean up cache directory
  await fs.rm(CACHE_DIR, { recursive: true, force: true });
}

runTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
