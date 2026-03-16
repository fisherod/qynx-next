import { getDb } from "@/lib/mongodb";

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
  await db
    .collection("auto_transfer_config")
    .updateOne({ key }, { $set: { value, updated_at: new Date() } }, { upsert: true });
}
