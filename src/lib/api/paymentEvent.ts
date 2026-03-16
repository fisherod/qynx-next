import { getDb, toDate } from "@/lib/mongodb";
import { PaymentEvent } from "@/types";

export async function logEvent(paymentId: string, eventType: string, data?: any): Promise<void> {
  const db = await getDb();
  await db.collection("payment_events").insertOne({
    payment_id: paymentId,
    event_type: eventType,
    data: data ? JSON.stringify(data) : null,
    created_at: new Date()
  });
}

export async function getPaymentEvents(paymentId: string): Promise<PaymentEvent[]> {
  const db = await getDb();
  const docs = await db.collection("payment_events").find({ payment_id: paymentId }).sort({ created_at: -1 }).toArray();
  return docs.map((d: any) => ({
    id: d._id?.toString() ?? 0,
    payment_id: d.payment_id,
    event_type: d.event_type,
    data: d.data ?? "",
    created_at: toDate(d.created_at)
  }));
}
