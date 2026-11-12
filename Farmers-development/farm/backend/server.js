const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

// Override DNS to bypass SRV lookup failures in restricted networks
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment variables from any standard location
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth.routes');
const todoRoutes = require('./routes/todo.routes');
const notificationRoutes = require('./routes/notification.routes');
const paymentRoutes = require('./routes/payment.routes');
const gpsTrackingRoutes = require('./routes/gpsTracking.routes');
const doctorClinicRoutes = require('./routes/doctorClinic.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const diseaseDetectionRoutes = require('./routes/diseaseDetection.routes');
const communityRoutes = require('./routes/community.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import services
const notificationService = require('./services/notificationService');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:8080';

// Debug: log env resolution once on startup
const envPath = path.resolve(__dirname, '../.env');
const envExists = fs.existsSync(envPath);
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;

if (!mongoUri) {
  console.warn(`[ENV DEBUG] cwd=${process.cwd()} envPath=${envPath} exists=${envExists}`);
  console.warn('⚠️ Missing required environment variable: MONGODB_URI (Server will start and retry connection)');
}

if (!process.env.JWT_SECRET) {
  console.error('❌ Missing required environment variable: JWT_SECRET');
  console.error('💡 Please set JWT_SECRET in your Render environment variables.');
  process.exit(1);
}

// Middleware
const allowedOrigins = [
  "https://agro-armor-frontend.onrender.com",
  "https://agroarmourlsm-frontend.onrender.com",
  "https://agroarmor-v2.onrender.com",
  "http://16.176.157.113", 
  "http://localhost:8080", 
  "http://localhost:8083", 
  "http://localhost:8084", 
  "http://localhost:8085", 
  "http://localhost:8086", 
  "http://127.0.0.1:8080", 
  "http://127.0.0.1:8083", 
  "http://127.0.0.1:8084", 
  "http://127.0.0.1:8085", 
  "http://127.0.0.1:8086"
];
if (process.env.CLIENT_ORIGIN && !allowedOrigins.includes(process.env.CLIENT_ORIGIN)) {
  allowedOrigins.push(process.env.CLIENT_ORIGIN);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, server-to-server, health checks)
    if (!origin) {
      return callback(null, true);
    }
    // Allow only explicitly approved origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Reject unapproved browser origins
    const corsError = new Error('CORS: Origin not allowed');
    corsError.status = 403;
    return callback(corsError);
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint - reports actual database and service status
app.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const readyState = mongoose.connection.readyState;
    const isConnected = readyState === 1;
    const isConnecting = readyState === 2;

    const status = isConnected ? 'healthy' : (isConnecting ? 'connecting' : 'unhealthy');
    const db = isConnected ? 'Connected' : (isConnecting ? 'Connecting' : 'Disconnected');
    const httpCode = isConnected ? 200 : 503;

    res.status(httpCode).json({ 
      status, 
      service: 'agro-armor-backend',
      db,
      database: isConnected ? mongoose.connection.name : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      service: 'agro-armor-backend',
      db: 'Error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware to ensure database is available before executing database-dependent API routes
const requireDatabase = (req, res, next) => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database unavailable',
      message: 'The database is currently connecting or unavailable. Please try again shortly.',
      dbState: mongoose.connection.readyState === 2 ? 'connecting' : 'disconnected'
    });
  }
  next();
};

// Protect all /api routes from running against a disconnected database
app.use('/api', requireDatabase);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/gps', gpsTrackingRoutes);
app.use('/api/medical', doctorClinicRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/detections', diseaseDetectionRoutes);
app.use('/api/community', communityRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Farm Management System with Medical, GPS Tracking & Appointments',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      todos: '/api/todos',
      notifications: '/api/notifications',
      payments: '/api/payments',
      gps: '/api/gps',
      medical: '/api/medical',
      appointments: '/api/appointments',
      detections: '/api/detections',
      community: '/api/community'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.method + ' ' + req.path });
});

// Start server and initialize database connection
const startServer = () => {
  try {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
      console.log(`📱 Client origin: ${CLIENT_ORIGIN}`);
      console.log(`🔊 Voice announcements: Enabled`);
      console.log(`📅 Notifications: Enabled`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    });

    // Connect to database in background without blocking server binding
    connectDB();

    // Hook into mongoose connection open event once for scheduler start
    const mongoose = require('mongoose');
    mongoose.connection.once('open', () => {
      notificationService.startScheduler();
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
