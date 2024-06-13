module.exports = async () => {
    console.log('Global teardown after running tests');
  
    
    const mongoose = require('mongoose');
  
    try {
      await mongoose.connection.close();
      console.log('Disconnected from MongoDB for global teardown');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  
    
  };
  