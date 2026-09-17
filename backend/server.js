const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB.
// On a traditional server (local / Render) this runs once at boot, exactly as before.
// On Vercel each serverless invocation may reuse a warm module, so the connection
// promise is cached and reused instead of reconnecting per request. The .catch()
// below marks the promise as handled (so a failure can never reach the
// unhandledRejection handler) and clears the cache so the next request retries.
let dbPromise = null;

const ensureDB = () => {
  if (!dbPromise) {
    dbPromise = connectDB();
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
};

ensureDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/tmdb', require('./routes/tmdbRoutes')); // new TMDB proxy route

// Ensure MongoDB is connected before any database-backed route runs. Scoped to the
// data routes only, so /api/health and / stay reachable even if the database is down.
app.use(
  ['/api/auth', '/api/movies', '/api/shows', '/api/bookings', '/api/payments', '/api/admin'],
  async (req, res, next) => {
    try {
      await ensureDB();
      next();
    } catch (error) {
      console.error('Database unavailable:', error.message);
      res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again.',
      });
    }
  }
);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/shows', require('./routes/showRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ShowTimeX API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      movies: '/api/movies',
      shows: '/api/shows',
      bookings: '/api/bookings',
      payments: '/api/payments',
      admin: '/api/admin',
    },
  });
});

// 404 Error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 5000;

// Vercel invokes the exported app directly, so no port is bound there.
// Local development and Render keep the traditional listening server.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   🎬 SHOWTIMEX API SERVER RUNNING 🎬    ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('════════════════════════════════════════\n');
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  // Close server & exit process. On Vercel, exiting would abort the whole
  // serverless invocation, so the rejection is only logged there.
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

module.exports = app;
