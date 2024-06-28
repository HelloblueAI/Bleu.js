const fs = require('fs');
const { execSync } = require('child_process');

if (fs.existsSync('./package-lock.json') || fs.existsSync('./pnpm-lock.yaml')) {
  execSync('npx npm-force-resolutions', { stdio: 'inherit' });
} else {
  console.error('Error: Neither package-lock.json nor pnpm-lock.yaml found.');
  process.exit(1);
}
