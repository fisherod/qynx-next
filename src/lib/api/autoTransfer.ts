import { getDb, toDate } from "@/lib/mongodb";

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
    created_at: transferData.timestamp
  });
}

export async function getAutoTransferHistory(limit = 100, offset = 0): Promise<any[]> {
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
    created_at: toDate(d.created_at)
  }));
}
