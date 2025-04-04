const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getPackageInfo, validateVersion } = require('./utils');

async function createRelease() {
  console.log('Creating Bleu.js release...\n');

  try {
    // Get package info
    const pkg = getPackageInfo();
    console.log(`Current version: ${pkg.version}\n`);

    // Get new version
    console.log('Enter new version (format: x.y.z):');
    const newVersion = await new Promise(resolve => {
      process.stdin.once('data', data => {
        resolve(data.toString().trim());
      });
    });

    // Validate new version
    validateVersion(newVersion);

    // Update package.json
    console.log('\n1. Updating package.json...');
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkgContent.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkgContent, null, 2) + '\n');
    console.log(`✓ Updated version to ${newVersion}`);

    // Run CI process
    console.log('\n2. Running CI process...');
    execSync('pnpm run ci', { stdio: 'inherit' });
    console.log('✓ CI process completed');

    // Create release commit
    console.log('\n3. Creating release commit...');
    execSync('git add package.json', { stdio: 'inherit' });
    execSync(`git commit -m "chore: release v${newVersion}"`, { stdio: 'inherit' });
    console.log('✓ Release commit created');

    // Create and push tag
    console.log('\n4. Creating git tag...');
    execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
    execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
    console.log('✓ Git tag created and pushed');

    // Push changes
    console.log('\n5. Pushing changes...');
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✓ Changes pushed');

    console.log('\n🎉 Release process completed successfully!');
    console.log(`Version ${newVersion} has been released.`);

  } catch (error) {
    console.error('\n❌ Release process failed:', error.message);
    process.exit(1);
  }
}

createRelease().catch(console.error); 