const mongoose = require('mongoose');

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

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;
