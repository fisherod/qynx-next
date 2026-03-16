// =================================
// MongoDB API database layer
// =================================

import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI environment variable is not set");
const options: MongoClientOptions = {
  appName: "devrel.nextjs.starter"
};

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb() {
  if (!clientPromise) throw new Error("MongoDB client not initialized (MONGODB_URI missing)");
  const client = await clientPromise;
  return client.db();
}

export async function dbConnectionStatus() {
  if (!process.env.MONGODB_URI) {
    return "No MONGODB_URI environment variable";
  }
  if (!clientPromise) {
    return "Database client not initialized";
  }
  try {
    const client = await clientPromise;
    const db = client.db();
    const result = await db.command({ ping: 1 });
    console.log("MongoDB connection successful:", result);
    return "Database connected";
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return "Database not connected";
  }
}

export function toDate(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") return val;
  return new Date().toISOString();
}
