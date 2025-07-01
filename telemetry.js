
import fs from 'fs/promises';
import path from 'path';

const TELEMETRY_DIR = path.join(process.cwd(), '.telemetry');
const DISABLE_TELEMETRY = process.env.DISABLE_TELEMETRY === '1';

/**
 * Records a telemetry event.
 * @param {string} eventName - The name of the event.
 * @param {object} data - The event data.
 */
export async function recordEvent(eventName, data) {
  if (DISABLE_TELEMETRY) {
    return;
  }
  try {
    await fs.mkdir(TELEMETRY_DIR, { recursive: true });
    const timestamp = new Date().toISOString();
    const date = timestamp.slice(0, 10);
    const logPath = path.join(TELEMETRY_DIR, `${date}.json`);
    const logEntry = { timestamp, eventName, data };
    await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error(`[ERROR] Error recording telemetry event: ${error.message}`);
  }
}

/**
 * Generates a telemetry dashboard.
 */
export async function generateDashboard() {
  try {
    const files = await fs.readdir(TELEMETRY_DIR);
    let totalRequests = 0;
    let errorRates = {};

    for (const file of files) {
      if (file.endsWith('.json')) {
        const logPath = path.join(TELEMETRY_DIR, file);
        const logContent = await fs.readFile(logPath, 'utf8');
        const logEntries = logContent.trim().split('\n').map(JSON.parse);

        for (const entry of logEntries) {
          totalRequests++;
          if (entry.eventName === 'error') {
            const errorType = entry.data.type || 'unknown';
            errorRates[errorType] = (errorRates[errorType] || 0) + 1;
          }
        }
      }
    }

    console.log('--- Telemetry Dashboard ---');
    console.log(`Total Requests: ${totalRequests}`);
    console.log('Error Rates:');
    for (const errorType in errorRates) {
      console.log(`  - ${errorType}: ${errorRates[errorType]}`);
    }
    console.log('-------------------------');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('[INFO] No telemetry data to generate a dashboard.');
    } else {
      console.error(`[ERROR] Error generating telemetry dashboard: ${error.message}`);
    }
  }
}

