import { getDb } from "@/lib/mongodb";
import { AdminWalletBalance } from "@/types";

export async function getWalletBalances(): Promise<AdminWalletBalance[]> {
  const db = await getDb();
  const docs = await db.collection("wallets").find({}).sort({ connected_at: -1 }).toArray();
  return (docs || []).map((w: any) => ({
    address: w.address,
    chain: w.chain,
    currency: w.currency,
    balance: "0.00",
    tokenBalance: w.token_balance ?? w.tokenBalance ?? "0.00",
    amount: w.amount ?? "0.00",
    paymentCount: w.payment_count ?? w.paymentCount ?? 0,
    lastActivity: w.last_activity ?? w.lastActivity ?? w.connected_at ?? w.connectedAt ?? new Date().toISOString()
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
        status: "active"
      },
      $setOnInsert: {
        address: walletData.address,
        chain: walletData.chain,
        currency: walletData.currency,
        connected_at: now
      },
      $inc: { payment_count: 1 }
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
    {
      $set: {
        currency,
        token_balance: tokenBalance,
        last_activity: new Date()
      }
    }
  );
}
