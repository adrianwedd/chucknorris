
import { fork, exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REFLECTIONS_LOG = path.join(__dirname, 'reflections.log');

async function runTest() {
  // Ensure reflections.log is clean before starting
  try {
    await fs.unlink(REFLECTIONS_LOG);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

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

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server stdout: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data}`);
  });

  // Let the server initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send a ListTools request
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  };
  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Let the server process the request
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Terminate the server
  serverProcess.kill('SIGINT');

  // Check if reflections.log was created and has content
  try {
    const logContent = await fs.readFile(REFLECTIONS_LOG, 'utf8');
    if (logContent.includes('[ListTools]')) {
      console.log('Test passed: reflections.log contains ListTools entry.');
    } else {
      console.error('Test failed: reflections.log does not contain ListTools entry.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test failed: reflections.log not found.');
    process.exit(1);
  } finally {
    // Clean up the log file
    await fs.unlink(REFLECTIONS_LOG);
  }
}

runTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
