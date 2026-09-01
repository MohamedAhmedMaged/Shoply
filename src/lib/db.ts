import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as MongooseCache;

export async function connectDB() {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define the DATABASE_URL (or MONGODB_URI) environment variable inside .env");
  }

  if (globalForMongoose.conn) return globalForMongoose.conn;

  if (!globalForMongoose.promise) {
    globalForMongoose.promise = mongoose.connect(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).catch((error) => {
      globalForMongoose.promise = null;
      throw error;
    });
  }

  try {
    globalForMongoose.conn = await globalForMongoose.promise;
    return globalForMongoose.conn;
  } catch (error) {
    globalForMongoose.promise = null;
    throw error;
  }
}

export default connectDB;
