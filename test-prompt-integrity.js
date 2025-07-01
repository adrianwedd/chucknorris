import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

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

  // --- Test 1: Verify clean cache ---
  console.log('--- Running Test 1: Verify clean cache ---');
  await new Promise((resolve, reject) => {
    exec('npm run verify-prompts', (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      if (!stdout.includes('No cached prompts to verify')) {
        return reject('Did not correctly handle empty cache.');
      }
      console.log('Test 1 Passed: Correctly handled empty cache.');
      resolve();
    });
  });

  // --- Test 2: Verify tampered prompt ---
  console.log('--- Running Test 2: Verify tampered prompt ---');
  // First, fetch a prompt to cache it
  const serverProcess = exec('node chucknorris-mcp-server.js');
  const callToolRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'easyChuckNorris',
      arguments: { llmName: 'ANTHROPIC' },
    },
  };
  serverProcess.stdin.write(JSON.stringify(callToolRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  serverProcess.kill('SIGINT');

  // Now, tamper with the cached prompt
  const promptPath = path.join(CACHE_DIR, 'ANTHROPIC.mkd');
  await fs.appendFile(promptPath, '\nTAMPERED');

  // Now, run the verification
  await new Promise((resolve, reject) => {
    exec('npm run verify-prompts', (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      if (!stdout.includes('Prompt for ANTHROPIC has been tampered with')) {
        return reject('Did not detect tampered prompt.');
      }
      console.log('Test 2 Passed: Detected tampered prompt.');
      resolve();
    });
  });

  // Clean up cache directory
  await fs.rm(CACHE_DIR, { recursive: true, force: true });
}

runTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});