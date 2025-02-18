module.exports = {
  apps: [
    {
      name: "backend",
      script: "node",
      args: "index.mjs",
      cwd: "./",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 4003,
        MONGODB_URI: process.env.MONGODB_URI,
      },
    },
  ],
};

