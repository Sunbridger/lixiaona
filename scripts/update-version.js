const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../sw.js');
const versionPath = path.join(__dirname, '../src/version.ts');

// Read sw.js
let swContent = fs.readFileSync(swPath, 'utf8');

// Find current version
const versionRegex = /const VERSION = 'v(\d+)';/;
const match = swContent.match(versionRegex);

if (!match) {
  console.error('Could not find version in sw.js');
  process.exit(1);
}

const currentVersion = parseInt(match[1], 10);
const newVersion = currentVersion + 1;
const newVersionString = `v${newVersion}`;

console.log(`Bumping version: v${currentVersion} -> ${newVersionString}`);

// Update sw.js
const newSwContent = swContent.replace(versionRegex, `const VERSION = '${newVersionString}';`);
fs.writeFileSync(swPath, newSwContent);

// Create/Update src/version.ts
// Ensure src directory exists (it likely does, but good to be safe)
const srcDir = path.dirname(versionPath);
if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
}

const versionFileContent = `// Auto-generated file. Do not edit manually.
export const APP_VERSION = '${newVersionString}';
`;
fs.writeFileSync(versionPath, versionFileContent);

console.log('Version updated successfully!');
