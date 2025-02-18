module.exports = {
  apps: [
    {
      name: 'eggs-generator',
      script: './dist/index.mjs',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      max_memory_restart: '1G',
      error_file: './logs/pm2/error.log',
      out_file: './logs/pm2/out.log',
      time: true,
    },
  ],
};
