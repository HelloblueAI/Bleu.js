const mongoose = require('mongoose');
const express = require('express');
const apiRoutes = require('./routes/apiRoutes');
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console()
  ],
});

const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());
app.use('/api', apiRoutes);

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

mongoose.connect('mongodb://bleujsUser:bleujsPassword@localhost:27017/bleujs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  logger.info('Successfully connected to MongoDB');
}).catch(err => {
  logger.error('Error connecting to MongoDB', err);
});


const closeServer = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0); 
    });
  } catch (err) {
    logger.error('Error closing MongoDB connection', err);
    process.exit(1); 
  }
};


process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);

module.exports = { app, server, closeServer };
