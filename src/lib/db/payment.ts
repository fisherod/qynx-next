import { getDb, toDate } from "@/lib/mongodb";
import { ChainType, CreatePaymentRequest, Payment, PaymentStatus } from "@/types";
import { logEvent } from "./paymentEvent";

// Payment operations
export async function createPayment(
  data: CreatePaymentRequest & { payment_id: string; expires_at: Date }
): Promise<Payment> {
  const db = await getDb();
  const now = new Date();
  const doc = {
    payment_id: data.payment_id,
    user_id: data.user_id,
    currency: data.currency ?? "usdt",
    amount: data.amount,
    expires_at: data.expires_at,
    status: "pending",
    created_at: now,
    updated_at: now
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

export async function updatePayment(
  paymentId: string,
  status: PaymentStatus,
  data?: { wallet_address?: string; chain?: ChainType; tx_hash?: string }
): Promise<void> {
  const db = await getDb();
  const update: any = { status, updated_at: new Date() };
  if (data?.wallet_address) update.wallet_address = data.wallet_address;
  if (data?.chain) update.chain = data.chain;
  if (data?.tx_hash) update.tx_hash = data.tx_hash;
  await db.collection("payments").updateOne({ payment_id: paymentId }, { $set: update });
  await logEvent(paymentId, "status_updated", { status, ...data });
}

export async function updatePaymentChain(paymentId: string, chain: ChainType): Promise<void> {
  const db = await getDb();
  await db.collection("payments").updateOne({ payment_id: paymentId }, { $set: { chain, updated_at: new Date() } });
  await logEvent(paymentId, "chain_updated", { chain });
}

export async function getExpiredPayments(): Promise<Payment[]> {
  const db = await getDb();
  const cursor = db.collection("payments").find({
    status: "pending",
    expires_at: { $lt: new Date() }
  });
  const docs = await cursor.toArray();
  return docs.map(docToPayment);
}

export async function markExpiredPayments(): Promise<number> {
  const db = await getDb();
  const result = await db
    .collection("payments")
    .updateMany(
      { status: "pending", expires_at: { $lt: new Date() } },
      { $set: { status: "expired", updated_at: new Date() } }
    );
  return result.modifiedCount;
}

export async function getPaymentCount(): Promise<{ total: number }> {
  const db = await getDb();
  const total = await db.collection("payments").countDocuments();
  return { total };
}

export async function getAllPayments(limit: number, offset: number): Promise<Payment[]> {
  const db = await getDb();
  const docs = await db.collection("payments").find({}).sort({ created_at: -1 }).skip(offset).limit(limit).toArray();
  return docs.map(docToPayment);
}

export async function getUniqueWalletAddresses(): Promise<{ address: string; chain: string | null }[]> {
  const db = await getDb();
  const docs = await db
    .collection("payments")
    .aggregate([
      { $match: { wallet_address: { $exists: true, $nin: [null, ""] } } },
      { $group: { _id: { address: "$wallet_address", chain: "$chain" } } },
      { $sort: { "_id.chain": 1, "_id.address": 1 } }
    ])
    .toArray();
  return docs.map((d: any) => ({
    address: d._id?.address ?? "",
    chain: d._id?.chain ?? null
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
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
        },
        failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        totalAmount: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] }
        }
      }
    }
  ];
  const result = await db.collection("payments").aggregate(pipeline).toArray();
  const s = result[0] ?? {};
  return {
    total: s.total ?? 0,
    completed: s.completed ?? 0,
    failed: s.failed ?? 0,
    pending: s.pending ?? 0,
    totalAmount: s.totalAmount ?? 0
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
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          totalAmount: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] }
          },
          lastPaymentDate: { $max: "$created_at" }
        }
      }
    ])
    .toArray();
  const s = result[0] ?? {};
  return {
    total: s.total ?? 0,
    completed: s.completed ?? 0,
    failed: s.failed ?? 0,
    pending: s.pending ?? 0,
    totalAmount: s.totalAmount ?? 0,
    lastPaymentDate: s.lastPaymentDate ? toDate(s.lastPaymentDate) : null
  };
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
    expires_at: toDate(doc.expires_at)
  };
}
