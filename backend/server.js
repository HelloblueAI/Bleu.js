// backend/server.js
const express = require('express');
const apiRoutes = require('./routes/apiRoutes');
const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());
app.use('/api', apiRoutes);

let server;

const startServer = () => {
  return new Promise((resolve) => {
    if (!server) {
      server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        resolve();
      });
    }
  });
};

const stopServer = () => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('Server stopped');
        server = null;
        resolve();
      });
    }
  });
};

module.exports = { app, startServer, stopServer };
