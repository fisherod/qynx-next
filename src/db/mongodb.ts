// =================================
// MongoDB API database layer
// =================================

import { ObjectId } from "mongodb";
import type {
  Payment,
  PaymentEvent,
  WebhookLog,
  CreatePaymentRequest,
  PaymentStatus,
  ChainType,
  AdminWalletBalance,
} from "@/types";

const DB_NAME = process.env.MONGODB_DB_NAME || undefined; // undefined = use default from URI
import { MongoClient, MongoClientOptions } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  appName: "devrel.nextjs.starter",
};

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  if (process.env.NODE_ENV === 'development') {
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
}

function toDate(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") return val;
  return new Date().toISOString();
}

function docToPayment(doc: any): Payment {
  return {
    id: doc._id?.toString() ?? doc.id ?? "",
    payment_id: doc.payment_id,
    user_id: doc.user_id,
    currency: doc.currency,
    amount: doc.amount,
    chain: doc.chain,
    status: doc.status,
    wallet_address: doc.wallet_address,
    tx_hash: doc.tx_hash,
    created_at: toDate(doc.created_at),
    updated_at: toDate(doc.updated_at),
    expires_at: toDate(doc.expires_at),
  };
}

async function getDb() {
  if (!clientPromise) throw new Error("MongoDB client not initialized (MONGODB_URI missing)");
  const client = await clientPromise;
  return client.db(DB_NAME);
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

export async function ensureInitialized(): Promise<void> {
  if (!process.env.MONGODB_URI || !clientPromise) {
    throw new Error("MongoDB not configured (MONGODB_URI / clientPromise)");
  }
  await clientPromise;
}

// Payment operations
export async function createPayment(
  data: CreatePaymentRequest & { payment_id: string; expires_at: Date }
): Promise<Payment> {
  const db = await getDb();
  const now = new Date();
  const doc = {
    payment_id: data.payment_id,
    user_id: data.user_id,
    currency: data.currency ?? 'usdt',
    amount: data.amount,
    expires_at: data.expires_at,
    status: "pending",
    created_at: now,
    updated_at: now,
  };
  await db.collection("payments").insertOne(doc);
  await logEvent(data.payment_id, "created", { amount: data.amount });
  const inserted = await db.collection("payments").findOne({ payment_id: data.payment_id });
  if (!inserted) throw new Error("Failed to create payment: not found after insert");
  return docToPayment(inserted);
}

export async function getPayment(paymentId: string): Promise<Payment | null> {
  const db = await getDb();
  const doc = await db.collection("payments").findOne({ payment_id: paymentId });
  return doc ? docToPayment(doc) : null;
}

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  data?: { wallet_address?: string; tx_hash?: string }
): Promise<void> {
  const db = await getDb();
  const update: any = { status, updated_at: new Date() };
  if (data?.wallet_address) update.wallet_address = data.wallet_address;
  if (data?.tx_hash) update.tx_hash = data.tx_hash;
  await db.collection("payments").updateOne({ payment_id: paymentId }, { $set: update });
  await logEvent(paymentId, "status_updated", { status, ...data });
}

export async function updatePaymentChain(paymentId: string, chain: ChainType): Promise<void> {
  const db = await getDb();
  await db.collection("payments").updateOne(
    { payment_id: paymentId },
    { $set: { chain, updated_at: new Date() } }
  );
  await logEvent(paymentId, "chain_updated", { chain });
}

export async function getExpiredPayments(): Promise<Payment[]> {
  const db = await getDb();
  const cursor = db.collection("payments").find({
    status: "pending",
    expires_at: { $lt: new Date() },
  });
  const docs = await cursor.toArray();
  return docs.map(docToPayment);
}

export async function markExpiredPayments(): Promise<number> {
  const db = await getDb();
  const result = await db.collection("payments").updateMany(
    { status: "pending", expires_at: { $lt: new Date() } },
    { $set: { status: "expired", updated_at: new Date() } }
  );
  return result.modifiedCount;
}

export async function logEvent(
  paymentId: string,
  eventType: string,
  data?: any
): Promise<void> {
  const db = await getDb();
  await db.collection("payment_events").insertOne({
    payment_id: paymentId,
    event_type: eventType,
    data: data ? JSON.stringify(data) : null,
    created_at: new Date(),
  });
}

export async function getPaymentEvents(paymentId: string): Promise<PaymentEvent[]> {
  const db = await getDb();
  const docs = await db
    .collection("payment_events")
    .find({ payment_id: paymentId })
    .sort({ created_at: -1 })
    .toArray();
  return docs.map((d: any) => ({
    id: d._id?.toString() ?? 0,
    payment_id: d.payment_id,
    event_type: d.event_type,
    data: d.data ?? "",
    created_at: toDate(d.created_at),
  }));
}

export async function logWebhook(
  paymentId: string,
  webhookUrl: string,
  payload: any,
  responseStatus: number,
  responseData?: any
): Promise<void> {
  const db = await getDb();
  await db.collection("webhook_logs").insertOne({
    payment_id: paymentId,
    webhook_url: webhookUrl,
    payload: JSON.stringify(payload),
    response_status: responseStatus,
    response_data: responseData ? JSON.stringify(responseData) : null,
    created_at: new Date(),
  });
}

export async function getWebhookLogs(paymentId: string): Promise<WebhookLog[]> {
  const db = await getDb();
  const docs = await db
    .collection("webhook_logs")
    .find({ payment_id: paymentId })
    .sort({ created_at: -1 })
    .toArray();
  return docs.map((d: any) => ({
    id: 0,
    payment_id: d.payment_id,
    webhook_url: d.webhook_url,
    payload: d.payload ?? "",
    response_status: d.response_status,
    response_data: d.response_data,
    created_at: toDate(d.created_at),
  }));
}

export async function getPaymentCount(): Promise<{ total: number }> {
  const db = await getDb();
  const total = await db.collection("payments").countDocuments();
  return { total };
}

export async function getAllPayments(limit: number, offset: number): Promise<Payment[]> {
  const db = await getDb();
  const docs = await db
    .collection("payments")
    .find({})
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();
  return docs.map(docToPayment);
}

export async function getUniqueWalletAddresses(): Promise<
  { address: string; chain: string | null }[]
> {
  const db = await getDb();
  const docs = await db
    .collection("payments")
    .aggregate([
      { $match: { wallet_address: { $exists: true, $nin: [null, ""] } } },
      { $group: { _id: { address: "$wallet_address", chain: "$chain" } } },
      { $sort: { "_id.chain": 1, "_id.address": 1 } },
    ])
    .toArray();
  return docs.map((d: any) => ({
    address: d._id?.address ?? "",
    chain: d._id?.chain ?? null,
  }));
}

export async function getPaymentStats(days = 30): Promise<{
  total: number;
  completed: number;
  failed: number;
  pending: number;
  totalAmount: number;
}> {
  const db = await getDb();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const pipeline = [
    { $match: { created_at: { $gte: since } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        totalAmount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] } },
      },
    },
  ];
  const result = await db.collection("payments").aggregate(pipeline).toArray();
  const s = result[0] ?? {};
  return {
    total: s.total ?? 0,
    completed: s.completed ?? 0,
    failed: s.failed ?? 0,
    pending: s.pending ?? 0,
    totalAmount: s.totalAmount ?? 0,
  };
}

export async function getWalletPaymentStats(
  walletAddress: string,
  chain: string
): Promise<{
  total: number;
  completed: number;
  failed: number;
  pending: number;
  totalAmount: number;
  lastPaymentDate: string | null;
}> {
  const db = await getDb();
  const result = await db
    .collection("payments")
    .aggregate([
      { $match: { wallet_address: walletAddress, chain } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          totalAmount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] } },
          lastPaymentDate: { $max: "$created_at" },
        },
      },
    ])
    .toArray();
  const s = result[0] ?? {};
  return {
    total: s.total ?? 0,
    completed: s.completed ?? 0,
    failed: s.failed ?? 0,
    pending: s.pending ?? 0,
    totalAmount: s.totalAmount ?? 0,
    lastPaymentDate: s.lastPaymentDate ? toDate(s.lastPaymentDate) : null,
  };
}

export async function getWalletBalances(): Promise<AdminWalletBalance[]> {
  const db = await getDb();
  const docs = await db.collection("wallets").find({}).sort({ connected_at: -1 }).toArray();
  return (docs || []).map((w: any) => ({
    address: w.address,
    chain: w.chain,
    balance: "0.00",
    usdtBalance: w.usdt_balance ?? w.usdtBalance ?? "0.00",
    amount: w.amount ?? "0.00",
    paymentCount: w.payment_count ?? w.paymentCount ?? 0,
    lastActivity:
      w.last_activity ?? w.lastActivity ?? w.connected_at ?? w.connectedAt ?? new Date().toISOString(),
  }));
}

export async function saveWallet(walletData: {
  address: string;
  chain: string;
  currency: string;
  amount?: string;
  tokenBalance?: string;
}): Promise<void> {
  const db = await getDb();
  const now = new Date();
  await db.collection("wallets").updateOne(
    { address: walletData.address, chain: walletData.chain },
    {
      $set: {
        token_balance: walletData.tokenBalance ?? "0.00",
        amount: walletData.amount ?? "0.00",
        last_activity: now,
        status: "active",
      },
      $setOnInsert: {
        address: walletData.address,
        chain: walletData.chain,
        currency: walletData.currency,
        connected_at: now,
      },
      $inc: { payment_count: 1 },
    },
    { upsert: true }
  );
}

export async function getWalletByAddress(address: string): Promise<any | null> {
  const db = await getDb();
  return db.collection("wallets").findOne({ address });
}

export async function updateWalletBalance(address: string, currency: string, tokenBalance: string): Promise<void> {
  const db = await getDb();
  await db.collection("wallets").updateOne(
    { address },
    { $set: { currency, token_balance: tokenBalance, last_activity: new Date() } }
  );
}

export async function recordTransfer(transferData: {
  success: boolean;
  txHash?: string;
  error?: string;
  amount: string;
  from: string;
  to: string;
  chain: string;
  timestamp: Date;
}): Promise<void> {
  const db = await getDb();
  await db.collection("auto_transfers").insertOne({
    from_address: transferData.from,
    to_address: transferData.to,
    amount: transferData.amount,
    chain: transferData.chain,
    tx_hash: transferData.txHash ?? null,
    success: transferData.success,
    error_message: transferData.error ?? null,
    created_at: transferData.timestamp,
  });
}

export async function getAutoTransferConfig(): Promise<Record<string, string>> {
  const db = await getDb();
  const docs = await db.collection("auto_transfer_config").find({}).toArray();
  const config: Record<string, string> = {};
  (docs || []).forEach((row: any) => {
    config[row.key] = row.value;
  });
  return config;
}

export async function updateAutoTransferConfig(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.collection("auto_transfer_config").updateOne(
    { key },
    { $set: { value, updated_at: new Date() } },
    { upsert: true }
  );
}

export async function getAutoTransferHistory(
  limit = 100,
  offset = 0
): Promise<any[]> {
  const db = await getDb();
  const docs = await db
    .collection("auto_transfers")
    .find({})
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();
  return docs.map((d: any) => ({
    ...d,
    id: d._id?.toString(),
    created_at: toDate(d.created_at),
  }));
}

export async function getTreasuryWallets(): Promise<any[]> {
  const db = await getDb();
  const docs = await db
    .collection("treasury_wallets")
    .find({})
    .sort({ chain: 1, created_at: -1 })
    .toArray();
  return (docs || []).map((d: any) => ({
    ...d,
    id: d._id?.toString(),
    address: d.address,
    chain: d.chain,
    name: d.name,
    description: d.description,
    is_active: d.is_active,
    created_at: d.created_at ? toDate(d.created_at) : undefined,
    updated_at: d.updated_at ? toDate(d.updated_at) : undefined,
  }));
}

export async function getTreasuryWallet(chain: string): Promise<any | null> {
  const db = await getDb();
  const doc = await db.collection("treasury_wallets").findOne(
    { chain, is_active: true },
    { sort: { created_at: -1 } }
  );
  if (!doc) return null;
  return {
    ...doc,
    id: doc._id?.toString(),
    address: doc.address,
    chain: doc.chain,
  };
}

export async function saveTreasuryWallet(
  chain: string,
  address: string,
  name?: string,
  description?: string
): Promise<any> {
  const db = await getDb();
  const now = new Date();
  await db.collection("treasury_wallets").updateMany(
    { chain },
    { $set: { is_active: false, updated_at: now } }
  );
  await db.collection("treasury_wallets").updateOne(
    { chain, address },
    {
      $set: {
        name: name ?? `${chain.toUpperCase()} Treasury`,
        description: description ?? `Default ${chain.toUpperCase()} treasury wallet`,
        is_active: true,
        updated_at: now,
      },
      $setOnInsert: {
        chain,
        address,
        created_at: now,
      },
    },
    { upsert: true }
  );
  const doc = await db.collection("treasury_wallets").findOne({
    chain,
    address,
    is_active: true,
  });
  if (!doc) throw new Error("Treasury wallet not found after save");
  return {
    ...doc,
    id: doc._id?.toString(),
    address: doc.address,
    chain: doc.chain,
  };
}

export async function deleteTreasuryWallet(id: number | string): Promise<void> {
  const db = await getDb();
  if (typeof id === "string" && /^[a-f0-9]{24}$/i.test(id)) {
    await db.collection("treasury_wallets").deleteOne({ _id: new ObjectId(id) });
  } else if (typeof id === "number") {
    await db.collection("treasury_wallets").deleteOne({ legacyId: id });
  } else {
    throw new Error("Invalid treasury wallet id");
  }
}

// API-compatible object (same shape as getDatabase() from lib/database)
const dbApi = {
  ensureInitialized,
  createPayment,
  getPayment,
  updatePaymentStatus,
  updatePaymentChain,
  getExpiredPayments,
  markExpiredPayments,
  logEvent,
  getPaymentEvents,
  logWebhook,
  getWebhookLogs,
  getPaymentCount,
  getAllPayments,
  getUniqueWalletAddresses,
  getPaymentStats,
  getWalletPaymentStats,
  getWalletBalances,
  saveWallet,
  getWalletByAddress,
  updateWalletBalance,
  recordTransfer,
  getAutoTransferConfig,
  updateAutoTransferConfig,
  getAutoTransferHistory,
  getTreasuryWallets,
  getTreasuryWallet,
  saveTreasuryWallet,
  deleteTreasuryWallet,
};

export function getDatabase() {
  return dbApi;
}
