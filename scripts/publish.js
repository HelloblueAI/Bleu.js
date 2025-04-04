const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getPackageInfo, validateVersion } = require('./utils');

async function publishPackage() {
  console.log('Publishing Bleu.js package...\n');

  try {
    // Get package info
    const pkg = getPackageInfo();
    console.log(`Package: ${pkg.name}@${pkg.version}\n`);

    // Verify version
    validateVersion(pkg.version);

    // Run verification
    console.log('1. Running verification...');
    execSync('pnpm run verify', { stdio: 'inherit' });
    console.log('✓ Verification passed');

    // Run pack and test
    console.log('\n2. Packing and testing...');
    execSync('pnpm run pack', { stdio: 'inherit' });
    console.log('✓ Packing and testing completed');

    // Check npm registry
    console.log('\n3. Checking npm registry...');
    try {
      execSync(`npm view ${pkg.name}@${pkg.version}`, { stdio: 'ignore' });
      throw new Error(`Version ${pkg.version} already exists in the registry`);
    } catch (error) {
      if (!error.message.includes('404')) {
        throw error;
      }
      console.log('✓ Version is available for publishing');
    }

    // Confirm publishing
    console.log('\n4. Ready to publish:');
    console.log(`   Package: ${pkg.name}`);
    console.log(`   Version: ${pkg.version}`);
    console.log('\nPress Enter to publish or Ctrl+C to cancel...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    // Publish the package
    console.log('\n5. Publishing to npm...');
    execSync('pnpm publish', { stdio: 'inherit' });
    console.log('\n✓ Package published successfully!');

    // Create git tag
    console.log('\n6. Creating git tag...');
    execSync(`git tag v${pkg.version}`, { stdio: 'inherit' });
    execSync(`git push origin v${pkg.version}`, { stdio: 'inherit' });
    console.log('✓ Git tag created and pushed');

    console.log('\n🎉 Publishing process completed successfully!');
    console.log(`Package ${pkg.name}@${pkg.version} is now available on npm.`);

  } catch (error) {
    console.error('\n❌ Publishing failed:', error.message);
    process.exit(1);
  }
}

publishPackage().catch(console.error); 