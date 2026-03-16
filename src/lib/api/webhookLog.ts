import { getDb, toDate } from "@/lib/mongodb";
import { WebhookLog } from "@/types";

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
    created_at: new Date()
  });
}

export async function getWebhookLogs(paymentId: string): Promise<WebhookLog[]> {
  const db = await getDb();
  const docs = await db.collection("webhook_logs").find({ payment_id: paymentId }).sort({ created_at: -1 }).toArray();
  return docs.map((d: any) => ({
    id: 0,
    payment_id: d.payment_id,
    webhook_url: d.webhook_url,
    payload: d.payload ?? "",
    response_status: d.response_status,
    response_data: d.response_data,
    created_at: toDate(d.created_at)
  }));
}
