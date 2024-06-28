const fs = require('fs');

const packageLockPath = './package-lock.json';

if (fs.existsSync(packageLockPath)) {
  const { execSync } = require('child_process');
  execSync('npx npm-force-resolutions', { stdio: 'inherit' });
} else {
  console.log('Skipping npm-force-resolutions: package-lock.json not found.');
}
