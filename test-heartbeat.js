import { spawnChild, monitorChildren } from './spawn-manager.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  // Start monitoring for stalled children
  monitorChildren(1000);

  // Spawn a child process that will send heartbeats
  const child = spawnChild(path.join(__dirname, 'test-child.js'));

  // Let the test run for a few seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  // The child should still be alive
  if (child.exitCode !== null) {
    console.error('Test failed: Child process was terminated prematurely.');
    process.exit(1);
  }

  // Now, spawn a child that will not send heartbeats
  const stalledChild = spawnChild(path.join(__dirname, 'test-stalled-child.js'));

  // Let the test run for a few seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  // The stalled child should have been terminated
  if (stalledChild.exitCode === null) {
    console.error('Test failed: Stalled child process was not terminated.');
    process.exit(1);
  }

  console.log('Test passed: Heartbeat monitoring is working correctly.');
  process.exit(0);
}

runTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});