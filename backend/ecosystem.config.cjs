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

module.exports = {
  apps: [
    {
      name: 'backend',
      script: './index.mjs',


      env: {
        NODE_ENV: 'production',
        PATH: `${process.env.HOME}/Bleu.js/backend/venv/bin:${process.env.PATH}`,
        VIRTUAL_ENV: `${process.env.HOME}/Bleu.js/backend/venv`,
        PORT: 3000,
        TZ: 'UTC',
      },


      increment_var: 'PORT',
      instances: 2,
      exec_mode: 'fork',
      instance_var: 'INSTANCE_ID',


      node_args: [
        '--experimental-specifier-resolution=node',
        '--max-old-space-size=4096',
        '--trace-warnings',
        '--unhandled-rejections=strict'
      ],


      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      force: true,


      error_log: './logs/pm2/error.log',
      out_log: './logs/pm2/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',


      max_restarts: 3,
      min_uptime: '30s',
      kill_timeout: 8000,
      wait_ready: true,


      exp_backoff_restart_delay: 100,
      listen_timeout: 10000,


      shutdown_with_message: true,


      deep_monitoring: true,
      status_interval: 30000,  // Status check every 30s


      source_map_support: true,
    }
  ]
};
