const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

// Override DNS to bypass SRV lookup failures
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Helper to mask and inspect MongoDB URI safely without exposing secrets
const inspectAndMaskUri = (rawUri) => {
  const cleanUri = (rawUri || '').trim();
  const hasBrackets = cleanUri.includes('<') || cleanUri.includes('>');
  const atMatches = cleanUri.match(/@/g) || [];
  const atCount = atMatches.length;

  // Mask password for safe diagnostic logging
  const lastAtIndex = cleanUri.lastIndexOf('@');
  let maskedUri = cleanUri;
  let username = 'unknown';
  let passLength = 0;
  let host = 'unknown';
  let queryParams = '';

  if (lastAtIndex !== -1) {
    const userInfo = cleanUri.slice(0, lastAtIndex);
    const hostAndRest = cleanUri.slice(lastAtIndex + 1);
    const slashIdx = hostAndRest.indexOf('/');
    const questionIdx = hostAndRest.indexOf('?');

    if (slashIdx !== -1) {
      host = hostAndRest.slice(0, slashIdx);
    } else if (questionIdx !== -1) {
      host = hostAndRest.slice(0, questionIdx);
    } else {
      host = hostAndRest;
    }

    if (questionIdx !== -1) {
      queryParams = hostAndRest.slice(questionIdx + 1);
    }

    const schemeEnd = userInfo.indexOf('://');
    if (schemeEnd !== -1) {
      const creds = userInfo.slice(schemeEnd + 3);
      const colonIdx = creds.indexOf(':');
      if (colonIdx !== -1) {
        username = creds.slice(0, colonIdx);
        const pass = creds.slice(colonIdx + 1);
        passLength = pass.length;
        const isBracketed = pass.startsWith('<') && pass.endsWith('>');
        const maskedStars = '*'.repeat(Math.max(1, isBracketed ? pass.length - 2 : pass.length));
        maskedUri = userInfo.slice(0, schemeEnd + 3) + username + ':' + (isBracketed ? `<${maskedStars}>` : maskedStars) + '@' + hostAndRest;
      }
    }
  }

  return { cleanUri, maskedUri, username, passLength, host, queryParams, hasBrackets, atCount };
};

let isConnecting = false;
let retryTimer = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return mongoose.connection.readyState === 1;
  }
  if (isConnecting) {
    return false;
  }

  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;

  if (!rawUri) {
    console.error('❌ Missing required environment variable: MONGODB_URI');
    console.error('💡 Please check your .env file or Render environment variables.');
    return false;
  }

  isConnecting = true;
  const { cleanUri, maskedUri, username, passLength, host, queryParams, hasBrackets, atCount } = inspectAndMaskUri(rawUri);

  console.log('⏳ Connecting to MongoDB...');
  console.log(`🔍 [DB DIAGNOSTIC] Host: ${host}`);
  console.log(`🔍 [DB DIAGNOSTIC] User: ${username} (Password length: ${passLength} chars)`);
  console.log(`🔍 [DB DIAGNOSTIC] Query params: ${queryParams || '(none)'}`);
  console.log(`🔍 [DB DIAGNOSTIC] URI: ${maskedUri}`);

  if (hasBrackets) {
    console.error('⚠️ [DB CONFIG ERROR] MONGODB_URI contains literal "<" or ">" characters!');
    console.error('👉 In Render environment variables, replace <password> with your actual password without the angle brackets.');
  }

  if (atCount > 1) {
    console.error('⚠️ [DB CONFIG ERROR] MONGODB_URI contains multiple "@" symbols!');
    console.error('👉 If your password contains "@", it must be URL-encoded (%40) or replaced with an alphanumeric password.');
  }

  try {
    const conn = await mongoose.connect(cleanUri, {
      dbName: process.env.DB_NAME || 'agroarmor',
      authSource: 'admin',
      serverSelectionTimeoutMS: 8000, // Timeout after 8 seconds
    });
    
    isConnecting = false;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnecting = false;
    console.error('❌ Error connecting to MongoDB:', error.message);
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.error('💡 TIP: Authentication failed. Verify that:');
      console.error('   1. The database user password in MongoDB Atlas (Database Access) matches MONGODB_URI in Render.');
      console.error('   2. The password does NOT contain literal angle brackets (< or >).');
      console.error('   3. The password has no unencoded special characters (recommend alphanumeric characters only).');
      console.error('   4. The database user has "Read and write to any database" role.');
    } else if (error.message.includes('IP not whitelisted')) {
      console.error('💡 TIP: Your current IP address might not be whitelisted on MongoDB Atlas.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('💡 TIP: Check your internet connection. Unable to resolve MongoDB hostname.');
    }
    console.error('🔄 Database connection failed. Will retry in 10 seconds (server remains online)...');
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connectDB();
      }, 10000);
    }
    return false;
  }
};

module.exports = connectDB;
