module.exports = {
  apps: [
    {
      name: "core-engine",
      script: "./src/index.mjs",
      interpreter: "node", // Ensures ES Module compatibility
      instances: "max", // Use all CPU cores
      exec_mode: "cluster", // Enables load balancing
      autorestart: true, // Restarts on crash/failure
      watch: false, // Disable watching in production
      max_memory_restart: "500M", // Restart if memory exceeds 500MB
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
