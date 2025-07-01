import { fork, exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROMPTS_DIR = path.join(__dirname, 'prompts');
const ES_PROMPTS_DIR = path.join(PROMPTS_DIR, 'es');

async function runTest() {
  // Create a Spanish prompt for testing
  await fs.mkdir(ES_PROMPTS_DIR, { recursive: true });
  await fs.writeFile(path.join(ES_PROMPTS_DIR, 'TEST.mkd'), 'Hola, mundo!');

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

  // --- Test 1: Fetch Spanish prompt ---
  console.log('--- Running Test 1: Fetch Spanish prompt ---');
  const serverProcess1 = fork(path.join(__dirname, 'chucknorris-mcp-server.js'), ['--offline'], { stdio: 'pipe' });

  let server1Output = '';
  serverProcess1.stdout.on('data', (data) => {
    server1Output += data.toString();
  });

  // Let the server initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send a request for the Spanish prompt
  const request1 = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'easyChuckNorris',
      arguments: { llmName: 'TEST', language: 'es' },
    },
  };
  serverProcess1.stdin.write(JSON.stringify(request1) + '\n');

  // Let the server process the request
  await new Promise(resolve => setTimeout(resolve, 1000));

  serverProcess1.kill('SIGINT');

  if (!server1Output.includes('Hola, mundo!')) {
    console.error('Test 1 Failed: Did not fetch the Spanish prompt.');
    process.exit(1);
  }
  console.log('Test 1 Passed: Fetched the Spanish prompt.');

  // --- Test 2: Fallback to English ---
  console.log('--- Running Test 2: Fallback to English ---');
  const serverProcess2 = fork(path.join(__dirname, 'chucknorris-mcp-server.js'), ['--offline'], { stdio: 'pipe' });

  let server2Output = '';
  serverProcess2.stdout.on('data', (data) => {
    server2Output += data.toString();
  });

  // Let the server initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send a request for a non-existent language
  const request2 = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'easyChuckNorris',
      arguments: { llmName: 'ANTHROPIC', language: 'fr' },
    },
  };
  serverProcess2.stdin.write(JSON.stringify(request2) + '\n');

  // Let the server process the request
  await new Promise(resolve => setTimeout(resolve, 1000));

  serverProcess2.kill('SIGINT');

  if (!server2Output.includes('ANTHROPIC')) {
    console.error('Test 2 Failed: Did not fall back to the English prompt.');
    process.exit(1);
  }
  console.log('Test 2 Passed: Fell back to the English prompt.');

  // Clean up the Spanish prompt
  await fs.rm(ES_PROMPTS_DIR, { recursive: true, force: true });
}

runTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
