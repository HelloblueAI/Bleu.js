import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createTemporaryDirectory } from './utils';

async function packAndVerify() {
  console.log('Packing and verifying Bleu.js package...\n');

  // Create temporary directory
  const tempDir = await createTemporaryDirectory();
  console.log(`Created temporary directory: ${tempDir}`);

  try {
    console.log('Building package...');
    execSync('pnpm run build', { stdio: 'inherit' });
    
    console.log('Creating package tarball...');
    execSync('pnpm pack', { stdio: 'inherit' });
    
    console.log('Package created successfully!');

    // Get the packed file name
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const packedFile = path.join(tempDir, `bleujs-${pkg.version}.tgz`);
    
    if (!fs.existsSync(packedFile)) {
      throw new Error('Packaged file not found');
    }
    console.log(`✓ Package created: ${packedFile}`);

    // Extract the package
    console.log('\n2. Extracting package...');
    const extractDir = path.join(tempDir, 'extracted');
    fs.mkdirSync(extractDir);
    execSync(`tar -xzf ${packedFile} -C ${extractDir}`, { stdio: 'inherit' });
    console.log('✓ Package extracted successfully');

    // Verify package contents
    console.log('\n3. Verifying package contents...');
    const packageDir = path.join(extractDir, 'package');
    
    // Check required files
    const requiredFiles = [
      'package.json',
      'dist/index.js',
      'dist/index.d.ts',
      'examples/quickstart.js',
      'examples/advanced_quantum_ml.js',
      'examples/performance_benchmark.js',
      'scripts/postinstall.js',
      'scripts/verify-publish.js',
      'README.md',
      'LICENSE.md'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(packageDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
      console.log(`✓ ${file} present`);
    });

    // Verify file sizes
    console.log('\n4. Verifying file sizes...');
    const distFiles = fs.readdirSync(path.join(packageDir, 'dist'));
    distFiles.forEach(file => {
      const filePath = path.join(packageDir, 'dist', file);
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error(`Empty file detected: dist/${file}`);
      }
      console.log(`✓ dist/${file}: ${(stats.size / 1024).toFixed(2)} KB`);
    });

    // Test the package
    console.log('\n5. Testing packed package...');
    const testDir = path.join(tempDir, 'test');
    fs.mkdirSync(testDir);
    
    // Initialize npm project
    execSync('npm init -y', { cwd: testDir, stdio: 'inherit' });
    
    // Install the packed package
    execSync(`npm install ${packedFile}`, { cwd: testDir, stdio: 'inherit' });
    console.log('✓ Package installed successfully');

    // Run quickstart example
    console.log('\n6. Running quickstart example...');
    const quickstart = `
      const { BleuJS } = require('bleujs');
      (async () => {
        const bleu = new BleuJS();
        await bleu.init();
        console.log('Bleu.js initialized successfully!');
      })();
    `;
    fs.writeFileSync(path.join(testDir, 'test.js'), quickstart);
    execSync('node test.js', { cwd: testDir, stdio: 'inherit' });
    console.log('✓ Quickstart example ran successfully');

    console.log('\n✓ Package verification completed successfully!');
    console.log(`Package is ready for publishing: ${packedFile}`);

  } catch (error) {
    console.error('\n❌ Package verification failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up
    console.log('\nCleaning up temporary files...');
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

packAndVerify().catch(console.error); 