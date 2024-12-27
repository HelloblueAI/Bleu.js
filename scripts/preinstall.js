const { execSync } = require('child_process');
const fs = require('fs');

if (fs.existsSync('./package-lock.json') || fs.existsSync('./pnpm-lock.yaml')) {
  execSync('npx npm-force-resolutions', { stdio: 'inherit' });
} else {
  console.error('Error: Neither package-lock.json nor pnpm-lock.yaml found.');
  process.exit(1);
}
