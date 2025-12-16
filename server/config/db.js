const mongoose = require('mongoose');
const config = require('./env');

// MongoDB connection with retry logic
const connectDB = async (retries = 5) => {
  let attempts = 0;
  
  while (attempts < retries) {
    try {
      const conn = await mongoose.connect(config.mongoose.url, config.mongoose.options);
      
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      console.log(`Database: ${conn.connection.name}`);
      
      // Connection event listeners
      mongoose.connection.on('error', (err) => {
        console.error(`MongoDB connection error: ${err.message}`);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected successfully');
      });
      
      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      });
      
      return conn;
    } catch (error) {
      attempts++;
      console.error(`MongoDB connection attempt ${attempts} failed: ${error.message}`);
      
      if (attempts < retries) {
        console.log(`Retrying in 5 seconds... (${retries - attempts} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error('Max retry attempts reached. Could not connect to MongoDB.');
        throw error;
      }
    }
  }
};

module.exports = connectDB;