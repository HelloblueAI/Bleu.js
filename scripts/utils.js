const fs = require('fs');
const path = require('path');
const os = require('os');

async function createTemporaryDirectory() {
  const tempDir = path.join(os.tmpdir(), `bleujs-${Date.now()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });
  return tempDir;
}

function validateVersion(version) {
  if (!version.match(/^\d+\.\d+\.\d+$/)) {
    throw new Error('Invalid version format. Must be in the format x.y.z');
  }
  return version;
}

function getPackageInfo() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return {
    name: pkg.name,
    version: pkg.version,
    main: pkg.main,
    types: pkg.types,
    files: pkg.files
  };
}

module.exports = {
  createTemporaryDirectory,
  validateVersion,
  getPackageInfo
}; 