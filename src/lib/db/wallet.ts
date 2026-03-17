import { getDb } from "@/lib/mongodb";
import { WalletBalance } from "@/types";

export async function getWalletBalances(): Promise<WalletBalance[]> {
  const db = await getDb();
  const docs = await db.collection("wallets").find({}).sort({ connected_at: -1 }).toArray();
  return (docs || []).map((w: any) => ({
    address: w.address,
    chain: w.chain,
    currency: w.currency,
    status: w.status ?? "not_invested",
    paymentCount: w.payment_count ?? 0,
    investedAmount: w.invested_amount ?? 0,
    lastAmount: w.last_amount ?? 0,
    lastActivity: w.last_activity ? new Date(w.last_activity).toISOString() : new Date().toISOString()
  })) as WalletBalance[];
}

export async function saveWallet(
  address: string,
  chain: string,
  currency: string,
  amount: number,
  status: string = "not_invested"
): Promise<void> {
  const db = await getDb();
  const now = new Date();
  await db.collection("wallets").updateOne(
    { address, chain, currency },
    {
      $set: {
        status: status,
        last_amount: amount,
        last_activity: now
      },
      $setOnInsert: {
        address,
        chain,
        currency,
        invested_amount: 0
      },
      $inc: { payment_count: 1 }
    },
    { upsert: true }
  );
}

export async function updateWallet(
  address: string,
  chain: string,
  currency: string,
  amount: number,
  status: string = "not_invested"
): Promise<void> {
  const db = await getDb();
  await db.collection("wallets").updateOne(
    { address, chain, currency },
    {
      $set: {
        status: status,
        last_amount: amount,
        last_activity: new Date()
      },
      $inc: { invested_amount: amount }
    }
  );
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
