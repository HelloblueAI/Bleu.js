const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getPackageInfo, validateVersion } = require('./utils');

async function runCI() {
  console.log('Running Bleu.js CI/CD process...\n');

  try {
    // Get package info
    const pkg = getPackageInfo();
    console.log(`Package: ${pkg.name}@${pkg.version}\n`);

    // Verify version
    validateVersion(pkg.version);

    // Install dependencies
    console.log('1. Installing dependencies...');
    execSync('pnpm install', { stdio: 'inherit' });
    console.log('✓ Dependencies installed');

    // Run tests
    console.log('\n2. Running tests...');
    execSync('pnpm test', { stdio: 'inherit' });
    console.log('✓ Tests passed');

    // Run benchmarks
    console.log('\n3. Running benchmarks...');
    execSync('pnpm run benchmark', { stdio: 'inherit' });
    console.log('✓ Benchmarks completed');

    // Build package
    console.log('\n4. Building package...');
    execSync('pnpm run build', { stdio: 'inherit' });
    console.log('✓ Build completed');

    // Verify package
    console.log('\n5. Verifying package...');
    execSync('pnpm run verify', { stdio: 'inherit' });
    console.log('✓ Package verified');

    // Pack and test
    console.log('\n6. Packing and testing...');
    execSync('pnpm run pack', { stdio: 'inherit' });
    console.log('✓ Packing and testing completed');

    // Check if this is a release
    const isRelease = process.env.GITHUB_REF?.startsWith('refs/tags/v');
    if (isRelease) {
      console.log('\n7. Publishing release...');
      execSync('pnpm publish', { stdio: 'inherit' });
      console.log('✓ Release published');
    }

    console.log('\n🎉 CI/CD process completed successfully!');
    if (isRelease) {
      console.log(`Package ${pkg.name}@${pkg.version} has been published.`);
    }

  } catch (error) {
    console.error('\n❌ CI/CD process failed:', error.message);
    process.exit(1);
  }
}

runCI().catch(console.error); 