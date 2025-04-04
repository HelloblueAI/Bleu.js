import { execSync } from 'child_process';

// Get the package version
const version = JSON.parse(execSync('npm pkg get version').toString()).replace(/"/g, '');

console.log(`Publishing version ${version}...`);

try {
  // Run the publish command
  execSync('npm publish --access public', { stdio: 'inherit' });
  console.log(`Successfully published version ${version}`);
} catch (error) {
  console.error('Failed to publish:', error);
  process.exit(1);
} 