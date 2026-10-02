const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { ensureDB } = require('./config/db');

// Builds the Express app without connecting to the database or listening.
// server.js wires in dotenv, the DB connection and app.listen(); tests
// import this file directly with an in-memory MongoDB already connected.
const app = express();

// Behind one reverse proxy (Render, Vercel, nginx) so rate limiting and
// req.ip see the real client address from X-Forwarded-For.
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS allow-list. CLIENT_URL may hold several origins separated by commas.
// Requests without an Origin header (curl, server-to-server, health checks)
// are not CORS requests and pass through.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      return callback(null, allowedOrigins.includes(origin));
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

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

module.exports = app;
