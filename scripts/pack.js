import { execSync } from 'child_process';

try {
  console.log('Building package...');
  execSync('pnpm run build', { stdio: 'inherit' });
  
  console.log('Creating package tarball...');
  execSync('pnpm pack', { stdio: 'inherit' });
  
  console.log('Package created successfully!');
} catch (error) {
  console.error('Error creating package:', error);
  process.exit(1);
} 