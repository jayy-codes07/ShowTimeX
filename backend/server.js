const dotenv = require('dotenv');
const path = require('path');

// Load environment variables before anything reads process.env.
dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { ensureDB } = require('./config/db');
const logger = require('./utils/logger');

// Connect to MongoDB.
// On a traditional server (local / Render) this runs once at boot.
// On Vercel each serverless invocation may reuse a warm module, so ensureDB()
// caches the connection promise and the per-route gate in app.js reuses it.
ensureDB().catch(() => {
  // Already logged inside connectDB; the route gate retries on the next request.
});

// Start server
const PORT = process.env.PORT || 5000;

// Vercel invokes the exported app directly, so no port is bound there.
// Local development and Render keep the traditional listening server.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(
      `ShowTimeX API listening on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`
    );
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('❌ Unhandled Rejection:', err.message);
  // Close server & exit process. On Vercel, exiting would abort the whole
  // serverless invocation, so the rejection is only logged there.
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

module.exports = app;
