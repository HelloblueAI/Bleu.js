import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\nVerifying Bleu.js package for publishing...\n');

// 1. Verify package.json
console.log('1. Verifying package.json...');
const pkg = JSON.parse(execSync('cat package.json').toString());

if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) {
  console.error('❌ Invalid version format');
  process.exit(1);
}
console.log('✓ Version format is valid');

if (!existsSync(pkg.main)) {
  console.error(`❌ Main entry point ${pkg.main} does not exist`);
  process.exit(1);
}
console.log('✓ Main entry point exists');

if (!existsSync(pkg.types)) {
  console.error(`❌ Types file ${pkg.types} does not exist`);
  process.exit(1);
}
console.log('✓ Types file exists');

// 2. Verify package files
console.log('\n2. Verifying package files...');
for (const file of pkg.files) {
  const path = join(__dirname, '..', file);
  if (!existsSync(path)) {
    console.error(`❌ ${file} does not exist`);
    process.exit(1);
  }
  console.log(`✓ ${file} exists`);
}

// 3. Run tests
console.log('\n3. Running tests...');
try {
  execSync('pnpm run test', { stdio: 'inherit' });
  console.log('✓ All tests passed');
} catch (error) {
  console.error('❌ Tests failed');
  process.exit(1);
}

console.log('\n✓ All verifications passed!');
process.exit(0); 