const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up Bleu.js...');

// Check Python installation
try {
  const pythonVersion = execSync('python3 --version').toString();
  console.log('✓ Python detected:', pythonVersion.trim());
} catch (error) {
  console.error('✗ Python 3 is required but not found. Please install Python 3.');
  console.error('Error details:', error.message);
  process.exit(1);
}

// Check pip installation
try {
  const pipVersion = execSync('pip3 --version').toString();
  console.log('✓ pip detected:', pipVersion.trim());
} catch (error) {
  console.error('✗ pip is required but not found. Please install pip.');
  console.error('Error details:', error.message);
  process.exit(1);
}

// Install Python dependencies
try {
  console.log('Installing Python dependencies...');
  execSync('pip3 install xgboost numpy scipy', { stdio: 'inherit' });
  console.log('✓ Python dependencies installed successfully');
} catch (error) {
  console.error('✗ Failed to install Python dependencies:', error.message);
  console.error('Error details:', error.message);
  process.exit(1);
}

// Verify quantum-computing package
try {
  require('quantum-computing');
  console.log('✓ Quantum computing package verified');
} catch (error) {
  console.error('✗ Quantum computing package not properly installed:', error.message);
  console.error('Error details:', error.message);
  process.exit(1);
}

// Verify XGBoost in Python
try {
  execSync('python3 -c "import xgboost"');
  console.log('✓ XGBoost package verified');
} catch (error) {
  console.error('✗ XGBoost package not properly installed:', error.message);
  console.error('Error details:', error.message);
  process.exit(1);
}

console.log('Bleu.js setup completed successfully!');
console.log('You can now use Bleu.js in your project.');
