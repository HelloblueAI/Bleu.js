//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

const fs = require('fs');

if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

module.exports = {
  apps: [
    {
      name: 'bleujs-backend',
      script: './backend/index.mjs',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      instance_var: 'INSTANCE_ID',
      exp_backoff_restart_delay: 200,
      max_memory_restart: '1G',
      out_file: './logs/bleujs-backend.log',
      error_file: './logs/bleujs-backend-error.log',
      combine_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      watch: false,
      autorestart: true,
    },
    {
      name: 'core-engine',
      script: './core-engine/src/index.mjs',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      instance_var: 'INSTANCE_ID',
      exp_backoff_restart_delay: 200,
      max_memory_restart: '2G',
      out_file: './logs/core-engine.log',
      error_file: './logs/core-engine-error.log',
      combine_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      watch: false,
      autorestart: true,
    },
    {
      name: 'eggs-generator',
      script: './eggs-generator/src/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      instance_var: 'INSTANCE_ID',
      exp_backoff_restart_delay: 100,
      max_memory_restart: '1G',
      out_file: './logs/eggs-generator.log',
      error_file: './logs/eggs-generator-error.log',
      combine_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      watch: false,
      autorestart: true,
    },
  ],
};
