const mongoose = require('mongoose');
const logger = require('../utils/logger');

const normalizeMongoUri = () => {
  const rawMongoUri = process.env.MONGO_URI;

  if (!rawMongoUri) {
    throw new Error('MONGO_URI is not set. Add the raw MongoDB connection string in your environment variables.');
  }

  let mongoUri = rawMongoUri.trim();

  if (
    (mongoUri.startsWith('"') && mongoUri.endsWith('"')) ||
    (mongoUri.startsWith("'") && mongoUri.endsWith("'"))
  ) {
    mongoUri = mongoUri.slice(1, -1).trim();
  }

  mongoUri = mongoUri.replace(/^MONGO_URI\s*=\s*/i, '');

  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    throw new Error(
      'Invalid MONGO_URI format. Use the raw MongoDB URI only, without quotes or a leading "MONGO_URI=" prefix.'
    );
  }

  return mongoUri;
};

const connectDB = async () => {
  try {
    const mongoUri = normalizeMongoUri();
    const conn = await mongoose.connect(mongoUri);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  logger.info('Mongoose disconnected from MongoDB');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed due to app termination');
  process.exit(0);
});

// Cached connection promise shared by server.js (boot) and app.js (per-route
// gate). Returns immediately when mongoose is already connected, which is how
// the test suite (mongodb-memory-server) bypasses MONGO_URI entirely. A failed
// attempt clears the cache so the next call retries.
let dbPromise = null;

const ensureDB = () => {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }
  if (!dbPromise) {
    dbPromise = connectDB();
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.ensureDB = ensureDB;
