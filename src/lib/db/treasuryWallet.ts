import { ObjectId } from "mongodb";
import { getDb, toDate } from "@/lib/mongodb";

export async function getTreasuryWallets(): Promise<any[]> {
  const db = await getDb();
  const docs = await db.collection("treasury_wallets").find({}).sort({ chain: 1, created_at: -1 }).toArray();
  return (docs || []).map((d: any) => ({
    ...d,
    id: d._id?.toString(),
    address: d.address,
    chain: d.chain,
    name: d.name,
    description: d.description,
    is_active: d.is_active,
    created_at: d.created_at ? toDate(d.created_at) : undefined,
    updated_at: d.updated_at ? toDate(d.updated_at) : undefined
  }));
}

export async function getTreasuryWallet(chain: string): Promise<any | null> {
  const db = await getDb();
  const doc = await db.collection("treasury_wallets").findOne({ chain, is_active: true }, { sort: { created_at: -1 } });
  if (!doc) return null;
  return {
    ...doc,
    id: doc._id?.toString(),
    address: doc.address,
    chain: doc.chain
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
  await db.collection("treasury_wallets").updateMany({ chain }, { $set: { is_active: false, updated_at: now } });
  await db.collection("treasury_wallets").updateOne(
    { chain, address },
    {
      $set: {
        name: name ?? `${chain.toUpperCase()} Treasury`,
        description: description ?? `Default ${chain.toUpperCase()} treasury wallet`,
        is_active: true,
        updated_at: now
      },
      $setOnInsert: {
        chain,
        address,
        created_at: now
      }
    },
    { upsert: true }
  );
  const doc = await db.collection("treasury_wallets").findOne({
    chain,
    address,
    is_active: true
  });
  if (!doc) throw new Error("Treasury wallet not found after save");
  return {
    ...doc,
    id: doc._id?.toString(),
    address: doc.address,
    chain: doc.chain
  };
}

export async function updateTreasuryWallet(id: string, isActive: boolean): Promise<any> {
  const db = await getDb();
  await db.collection("treasury_wallets").updateOne({ _id: new ObjectId(id) }, { $set: { is_active: isActive } });
  const doc = await db.collection("treasury_wallets").findOne({ _id: new ObjectId(id) });
  if (!doc) throw new Error("Treasury wallet not found after update");
  return {
    ...doc,
    id: doc._id?.toString()
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
