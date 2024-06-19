// simpleServer.js
const express = require('express');
const simpleRoute = require('./backend/routes/simpleRoute'); // Corrected path

const app = express();
const PORT = 3007;

app.use('/api', simpleRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
