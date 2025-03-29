/**
 * Copyright (c) 2025, Helloblue Inc.
 * Open-Source Community Edition
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, subject to the following conditions:
 *
 * 1. The above copyright notice and this permission notice shall be included in
 *    all copies or substantial portions of the Software.
 * 2. Contributions to this project are welcome and must adhere to the project's
 *    contribution guidelines.
 * 3. The name "Helloblue Inc." and its contributors may not be used to endorse
 *    or promote products derived from this software without prior written consent.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { existsSync } from 'fs';
import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

interface PreinstallConfig {
  readonly packageLockPath: string;
  readonly execOptions: ExecSyncOptionsWithStringEncoding;
}

const getConfig = (): PreinstallConfig => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return {
    packageLockPath: resolve(__dirname, 'package-lock.json'),
    execOptions: { 
      stdio: 'inherit',
      encoding: 'utf-8'
    }
  };
};

const runForceResolutions = (config: PreinstallConfig): void => {
  if (existsSync(config.packageLockPath)) {
    try {
      execSync('npx npm-force-resolutions', config.execOptions);
    } catch (error) {
      console.error('Error running npm-force-resolutions:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  } else {
    console.log('Skipping npm-force-resolutions: package-lock.json not found.');
  }
};

// Execute the script
runForceResolutions(getConfig()); 