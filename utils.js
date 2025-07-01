/**
 * Utility functions for the ChuckNorris MCP server
 */
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

// Caching settings
const CACHE_DIR = path.join(process.cwd(), '.prompt-cache');
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// CLI flags
export const OFFLINE_MODE =
  process.argv.includes('--offline') || process.env.CHUCKNORRIS_OFFLINE === '1';
export const noCache = () => process.argv.includes('--no-cache');

// Directory to load local prompts from
export const LOCAL_PROMPTS_DIR =
  process.env.CHUCKNORRIS_PROMPTS_DIR || path.join(process.cwd(), 'prompts');

// Base URL for the L1B3RT4S repository. Can be overridden via environment
// variable or the CLI option in `chucknorris-mcp-server.js`.
export let L1B3RT4S_BASE_URL =
  process.env.L1B3RT4S_BASE_URL ||
  'https://raw.githubusercontent.com/elder-plinius/L1B3RT4S/main';

/**
 * Override the base URL for fetching prompts.
 * @param {string} url - New base URL
 */
export function setL1B3RT4SBaseUrl(url) {
  if (url && typeof url === 'string') {
    L1B3RT4S_BASE_URL = url;
  }
}

/**
 * Load a prompt from the local prompts directory
 * @param {object} session - The session object.
 * @param {string} llmName - Name of the LLM
 * @returns {Promise<string>} - The prompt text
 */
async function loadLocalPrompt(session, llmName) {
  const filePath = path.join(LOCAL_PROMPTS_DIR, `${llmName}.mkd`);
  const prompt = await fs.readFile(filePath, 'utf8');
  if (!prompt || prompt.trim().length === 0) {
    throw new Error(`Local prompt file is empty: ${filePath}`);
  }
  session.llmName = llmName;
  session.prompt = prompt;
  console.error(`[INFO] Loaded local prompt from ${filePath}`);
  return prompt;
}

/**
 * Fetch a prompt from the L1B3RT4S repository, with caching and integrity verification.
 * @param {object} session - The session object.
 * @param {string} llmName - Name of the LLM
 * @returns {Promise<string>} - The prompt
 */
export async function fetchPrompt(session, llmName) {
  if (OFFLINE_MODE) {
    console.error('[INFO] Offline mode enabled, loading local prompt');
    return loadLocalPrompt(session, llmName);
  }

  const cachePath = path.join(CACHE_DIR, `${llmName}.mkd`);
  const hashPath = path.join(CACHE_DIR, `${llmName}.sha256`);

  if (!noCache()) {
    try {
      const stats = await fs.stat(cachePath);
      if (Date.now() - stats.mtimeMs < CACHE_DURATION_MS) {
        const cachedPrompt = await fs.readFile(cachePath, 'utf8');
        const cachedHash = await fs.readFile(hashPath, 'utf8');
        const currentHash = createHash('sha256').update(cachedPrompt).digest('hex');
        if (cachedPrompt && cachedHash === currentHash) {
          console.error(`[INFO] Loaded prompt from cache: ${cachePath}`);
          session.llmName = llmName;
          session.prompt = cachedPrompt;
          return cachedPrompt;
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`[WARN] Error reading cache file: ${error.message}`);
      }
    }
  }

  try {
    // Fetch the prompt directly using the model name
    const url = `${L1B3RT4S_BASE_URL}/${llmName}.mkd`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch prompt: ${response.statusText} (${response.status})`);
    }
    
    // Get the prompt
    const fullPrompt = await response.text();
    
    if (!fullPrompt || fullPrompt.trim().length === 0) {
      throw new Error('Received empty prompt');
    }
    
    try {
      // Split by h1 headings (# ) and take the first section, which should be the newest prompt
      const promptSections = fullPrompt.split(/^# /m).filter(Boolean);
      
      // If we have sections, use the first one, otherwise use the full prompt
      if (promptSections.length > 0) {
        // Add back the # that was removed by the split
        const firstPrompt = '# ' + promptSections[0].trim();
        
        // If the extracted section is valid, use it
        if (firstPrompt && firstPrompt.trim().length > 5) {
          console.error(`[INFO] Successfully extracted first prompt section (${firstPrompt.length} chars)`);
          
          // Store the current prompt
          session.llmName = llmName;
          session.prompt = firstPrompt;
          
          // Cache the prompt
          if (!noCache()) {
            await fs.mkdir(CACHE_DIR, { recursive: true });
            await fs.writeFile(cachePath, firstPrompt, 'utf8');
            const currentHash = createHash('sha256').update(firstPrompt).digest('hex');
            await fs.writeFile(hashPath, currentHash, 'utf8');
            console.error(`[INFO] Cached prompt to ${cachePath}`);
          }

          return firstPrompt;
        }
      }
      
      // Fallback: use the full prompt
      console.error('[INFO] No valid sections found, using full prompt');
      
      // Store the current prompt
      session.llmName = llmName;
      session.prompt = fullPrompt;
      
      // Cache the prompt
      if (!noCache()) {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        await fs.writeFile(cachePath, fullPrompt, 'utf8');
        const currentHash = createHash('sha256').update(fullPrompt).digest('hex');
        await fs.writeFile(hashPath, currentHash, 'utf8');
        console.error(`[INFO] Cached prompt to ${cachePath}`);
      }

      return fullPrompt;
    } catch (sectionError) {
      // If anything goes wrong with the section extraction, fall back to the full prompt
      console.error('[ERROR] Error extracting prompt section:', sectionError);
      
      // Store the current prompt
      session.llmName = llmName;
      session.prompt = fullPrompt;
      
      return fullPrompt;
    }
  }
  catch (error) {
    console.error('[WARN] Error fetching prompt:', error);
    console.error('[INFO] Attempting to load local prompt instead');
    return loadLocalPrompt(session, llmName);
  }
}

/**
 * Appends a critique to the reflections.log file.
 * @param {string} agentName - The name of the agent.
 * @param {string} critique - The critique message.
 */
export async function reflect(agentName, critique) {
  const logPath = path.join(process.cwd(), 'reflections.log');
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${agentName}] ${critique}\n`;
  await fs.appendFile(logPath, logEntry);
}

/**
 * Verifies the integrity of cached prompts.
 */
export async function verifyPrompts() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    for (const file of files) {
      if (file.endsWith('.mkd')) {
        const llmName = file.replace('.mkd', '');
        const promptPath = path.join(CACHE_DIR, file);
        const hashPath = path.join(CACHE_DIR, `${llmName}.sha256`);
        try {
          const prompt = await fs.readFile(promptPath, 'utf8');
          const storedHash = await fs.readFile(hashPath, 'utf8');
          const currentHash = createHash('sha256').update(prompt).digest('hex');
          if (storedHash !== currentHash) {
            console.warn(`[WARN] Prompt for ${llmName} has been tampered with. Auto-refreshing.`);
            await fetchPrompt({}, llmName);
          } else {
            console.log(`[INFO] Prompt for ${llmName} is valid.`);
          }
        } catch (error) {
          console.error(`[ERROR] Error verifying prompt for ${llmName}: ${error.message}`);
        }
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('[INFO] No cached prompts to verify.');
    } else {
      console.error(`[ERROR] Error reading cache directory: ${error.message}`);
    }
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
if (args.includes('verifyPrompts')) {
  verifyPrompts();
}
const l1b3rt4sUrlIndex = args.indexOf('--l1b3rt4s-url');
if (l1b3rt4sUrlIndex !== -1 && args[l1b3rt4sUrlIndex + 1]) {
  setL1B3RT4SBaseUrl(args[l1b3rt4sUrlIndex + 1]);
}

