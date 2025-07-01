import { fork, exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TELEMETRY_DIR = path.join(__dirname, '.telemetry');

async function runTest() {
  // Clean up telemetry directory before starting
  await fs.rm(TELEMETRY_DIR, { recursive: true, force: true });

  // Install dependencies
  await new Promise((resolve, reject) => {
    exec('npm install', (error, stdout, stderr) => {
      if (error) {
        console.error(`npm install error: ${error}`);
        return reject(error);
      }n      console.log(`npm install stdout: ${stdout}`);
      console.error(`npm install stderr: ${stderr}`);
      resolve();
    });
  });

  // --- Test 1: Verify telemetry is disabled ---
  console.log('--- Running Test 1: Verify telemetry is disabled ---');
  const serverProcess = fork(path.join(__dirname, 'chucknorris-mcp-server.js'), [], {
    env: { ...process.env, DISABLE_TELEMETRY: '1' },
    stdio: 'pipe',
  });

  // Let the server initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send a request to trigger a telemetry event
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  };
  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Let the server process the request
  await new Promise(resolve => setTimeout(resolve, 1000));

  serverProcess.kill('SIGINT');

  const date = new Date().toISOString().slice(0, 10);
  const logPath = path.join(TELEMETRY_DIR, `${date}.json`);

  try {
    await fs.access(logPath);
    console.error('Test 1 Failed: Telemetry log file was created even when disabled.');
    process.exit(1);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Test 1 Passed: Telemetry log file was not created.');
    } else {
      throw error;
    }
  }

  // Clean up telemetry directory
  await fs.rm(TELEMETRY_DIR, { recursive: true, force: true });
}

runTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});