
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const RESEARCH_DIR = path.join(process.cwd(), 'research');
const RESEARCH_FILE = path.join(RESEARCH_DIR, 'papers.json');

async function syncResearchPapers() {
  await fs.mkdir(RESEARCH_DIR, { recursive: true });

  const response = await fetch('https://api.crossref.org/works?query=LLM+security+jailbreak&rows=100');
  const data = await response.json();

  await fs.writeFile(RESEARCH_FILE, JSON.stringify(data.message.items, null, 2));
  console.log(`Synced research papers to ${RESEARCH_FILE}`);
}

syncResearchPapers();
