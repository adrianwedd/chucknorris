
import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';

const REFLECTIONS_LOG = path.join(process.cwd(), 'reflections.log');
const ARCHIVE_DIR = path.join(process.cwd(), 'reflections-archive');

async function archiveReflections() {
  try {
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const archivePath = path.join(ARCHIVE_DIR, `${year}-${month}.log.gz`);

    const logContent = await fs.readFile(REFLECTIONS_LOG, 'utf8');
    const compressedLog = zlib.gzipSync(logContent);

    await fs.writeFile(archivePath, compressedLog);
    await fs.unlink(REFLECTIONS_LOG);

    console.log(`Archived reflections to ${archivePath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('[INFO] No reflection log to archive.');
    } else {
      console.error(`[ERROR] Error archiving reflections: ${error.message}`);
    }
  }
}

archiveReflections();
