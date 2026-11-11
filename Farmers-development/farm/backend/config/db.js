const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

// Override DNS to bypass SRV lookup failures
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ Missing required environment variable: MONGODB_URI');
      console.error('💡 Please check your .env file in the root directory.');
      process.exit(1);
    }

    console.log('⏳ Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'agroarmor',
      authSource: 'admin',
      serverSelectionTimeoutMS: 8000, // Timeout after 8 seconds
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    if (error.message.includes('IP not whitelisted')) {
      console.error('💡 TIP: Your current IP address might not be whitelisted on MongoDB Atlas.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('💡 TIP: Check your internet connection. Unable to resolve MongoDB hostname.');
    }
    console.error('💥 Backend server cannot start without a database connection.');
    process.exit(1);
  }
};

module.exports = connectDB;
