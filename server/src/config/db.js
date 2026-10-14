import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/progresspilot';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
  } catch (error) {
    isConnected = false;
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.error(`[MongoDB] Ensure MONGODB_URI is set in server/.env (e.g. MongoDB Atlas connection string or local MongoDB instance)`);
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[MongoDB] Disconnected from database');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('[MongoDB] Reconnected to database');
});

export const getDBStatus = () => ({
  isConnected,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || null,
  name: mongoose.connection.name || null,
});
