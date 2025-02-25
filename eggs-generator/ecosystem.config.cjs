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
      name: 'eggs-generator',
      script: './src/index.mjs',


      instances: 1,
      exec_mode: 'cluster',
      instance_var: 'INSTANCE_ID',


      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        TZ: 'UTC',
        RUNNING_UNDER_PM2: 'true',
        PM2_CLUSTER: 'true'
      },

      increment_var: 'PORT',

      watch: false,
      autorestart: true,
      restart_delay: 5000,
      exp_backoff_restart_delay: 200,

      max_memory_restart: '1536M',
      min_uptime: '30s',
      kill_timeout: 8000,


      error_file: './logs/pm2/error.log',
      out_file: './logs/pm2/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',

      max_restarts: 5,
      listen_timeout: 10000,

      source_map_support: true,

      shutdown_with_message: true,
      deep_monitoring: true,
      status_interval: 30000,


      wait_ready: false,

      node_args: [
        '--experimental-specifier-resolution=node',
        '--max-old-space-size=4096',
        '--trace-warnings',
        '--unhandled-rejections=strict',
      ],
    },
  ],
};
