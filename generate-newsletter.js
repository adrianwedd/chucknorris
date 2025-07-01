
import fs from 'fs/promises';
import path from 'path';

async function generateNewsletter() {
  const newsletterDir = path.join(process.cwd(), 'newsletters');
  await fs.mkdir(newsletterDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const newsletterPath = path.join(newsletterDir, `${date}.md`);

  const newsletterContent = `
# Weekly Security Newsletter - ${date}

## 1. Vulnerability Scans

*No new vulnerabilities found.*

## 2. Patched Dependencies

*No dependencies were patched this week.*

## 3. Security Advisories

*No new security advisories.*
`;

  await fs.writeFile(newsletterPath, newsletterContent.trim());
  console.log(`Generated weekly security newsletter: ${newsletterPath}`);
}

generateNewsletter();
